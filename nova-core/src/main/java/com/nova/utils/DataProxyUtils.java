package com.nova.utils;

import com.nova.annotation.NovaField;
import com.nova.service.data.DataProxy;
import com.nova.annotation.sub.nova.field.edit.LinkTargetType;
import com.nova.config.NovaApplication;
import lombok.SneakyThrows;
import org.springframework.core.convert.ConversionService;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

public class DataProxyUtils {

    /**
     * 获取数据代理类
     *
     * @param className 类名
     * @return 数据代理
     */
    public static DataProxy<?> getDataProxy(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return null;
        }
        return SpringBeanUtils.getBean(scanNova.getDataProxyClass());
    }

    /**
     * 根据列名（snake_case）和值列表，反射构造实体对象
     */
    @SneakyThrows
    public static Object buildModel(String novaName, List<String> columns, List<String> values) {
        NovaApplication.ScanNova scanNova = NovaApplication.getScanNovas().get(novaName);
        if (scanNova == null) return null;
        Class<?> clz = scanNova.getClz();
        Object model = clz.getDeclaredConstructor().newInstance();
        for (int i = 0; i < columns.size(); i++) {
            String value = values.get(i);
            if (value == null || value.isEmpty()) continue;
            try {
                Field f = clz.getDeclaredField(MixUtils.snakeToCamel(columns.get(i)));
                f.setAccessible(true);
                f.set(model, convertValue(value, f.getType()));
            } catch (NoSuchFieldException | IllegalArgumentException ignored) {
            }
        }
        return model;
    }

    /**
     * 将实体对象转为 Map，日期类型统一转为 ms 时间戳
     */
    public static Map<String, Object> toMapWithTimestamp(Object entity) {
        Map<String, Object> map = new LinkedHashMap<>();
        Field[] fields = entity.getClass().getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            try {
                Object val = field.get(entity);
                if (val instanceof LocalDateTime ldt) {
                    val = ldt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
                } else if (val instanceof LocalDate ld) {
                    val = ld.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
                } else if (val instanceof Date d) {
                    val = d.getTime();
                }
                map.put(field.getName(), val);
            } catch (IllegalAccessException e) {
                // ignore
            }
        }
        return map;
    }

    /**
     * 设置REFERENCE组件字段（构造嵌套对象并赋值）
     */
    @SneakyThrows
    public static void setReferenceField(String novaName, Object model, String fieldName, String value) {
        // 获取对象引用参数信息
        Map<String, NovaFieldUtils.ReferenceTypeInfo> refs = NovaFieldUtils.getReference(novaName);
        NovaFieldUtils.ReferenceTypeInfo refInfo = refs.get(fieldName);
        // 若目标字段不是引用字段，则不进行任何操作
        if (refInfo == null) {
            return;
        }
        // 获取模型中的目标字段并允许反射访问
        Field modelField = model.getClass().getDeclaredField(fieldName);
        modelField.setAccessible(true);
        // 若值为空，则清空模型字段（设置为null）
        if (value == null || value.isEmpty()) {
            modelField.set(model, null);
            return;
        }
        // 获取引用对象的实际类型（如User、Department等实体类）
        Class<?> refClass = refInfo.getReferenceClass();
        // 通过无参构造创建引用对象实例
        Object refInstance = refClass.getDeclaredConstructor().newInstance();
        // 获取引用对象中实际存储数据的字段（如id字段）
        Field storageF = refClass.getDeclaredField(refInfo.getStorageField());
        storageF.setAccessible(true);
        // 将字符串值转换为存储字段所需的类型并设置到引用对象
        storageF.set(refInstance, convertValue(value, storageF.getType()));
        // 将完整的引用对象赋值给模型字段
        modelField.set(model, refInstance);
    }

    /**
     * 设置APPENDAGE组件字段（通过appNovaName找到主对象对应字段，将子对象赋值）
     */
    @SneakyThrows
    public static void setAppendageField(String novaName, Object model, String appNovaName, Object appModel) {
        Map<String, NovaFieldUtils.AppendageTypeInfo> appendages = NovaFieldUtils.getAppendage(novaName);
        NovaApplication.ScanNova appScanNova = NovaApplication.getScanNovas().get(appNovaName);
        if (appScanNova == null) {
            return;
        }
        Class<?> appClass = appScanNova.getClz();
        for (Map.Entry<String, NovaFieldUtils.AppendageTypeInfo> entry : appendages.entrySet()) {
            if (entry.getValue().getReferenceClass() == appClass) {
                Field f = model.getClass().getDeclaredField(entry.getKey());
                f.setAccessible(true);
                f.set(model, appModel);
                return;
            }
        }
    }

    /**
     * 设置 LINK_TARGET 组件字段，根据注解的 type 区分源引用 / 目标引用
     */
    @SneakyThrows
    public static void setLinkTargetField(String novaName, Object model, String fieldName, String value) {
        NovaFieldUtils.LinkTargetInfo lt = NovaFieldUtils.getLinkTarget(novaName);
        Field modelField = model.getClass().getDeclaredField(fieldName);
        modelField.setAccessible(true);
        if (value == null || value.isEmpty()) {
            modelField.set(model, null);
            return;
        }
        // 根据字段注解的 type 决定引用信息
        NovaField nf = modelField.getAnnotation(NovaField.class);
        LinkTargetType ltt = nf.edit().linkTargetType();
        boolean isOperate = ltt.type() == LinkTargetType.Type.OPERATE;
        Class<?> refClass = isOperate ? lt.getThisReferenceClass() : lt.getLinkReferenceClass();
        String storageField = isOperate ? lt.getThisStorageField() : lt.getLinkStorageField();
        Object ref = refClass.getDeclaredConstructor().newInstance();
        Field sf = refClass.getDeclaredField(storageField);
        sf.setAccessible(true);
        sf.set(ref, convertValue(value, sf.getType()));
        modelField.set(model, ref);
    }

    /**
     * 将字符串转为指定类型
     */
    private static Object convertValue(String value, Class<?> type) {
        // 日期类型：前端发 ms 时间戳字符串，手动处理
        if (type == LocalDateTime.class) {
            return Instant.ofEpochMilli(Long.parseLong(value)).atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
        if (type == LocalDate.class) {
            return Instant.ofEpochMilli(Long.parseLong(value)).atZone(ZoneId.systemDefault()).toLocalDate();
        }
        if (type == Date.class) {
            return new Date(Long.parseLong(value));
        }
        // 其他类型交给 Spring ConversionService
        ConversionService cs = SpringBeanUtils.getBean(ConversionService.class);
        if (cs.canConvert(String.class, type)) return cs.convert(value, type);
        return value;
    }

    /**
     * 解析 ["a","b","c"] 格式的 JSON 字符串数组
     */
    public static List<String> parseJsonArray(String raw) {
        List<String> result = new ArrayList<>();
        if (raw == null || raw.isBlank()) return result;
        String s = raw.trim();
        if (s.startsWith("[")) s = s.substring(1);
        if (s.endsWith("]")) s = s.substring(0, s.length() - 1);
        for (String part : s.split(",")) {
            String id = part.trim().replaceAll("^\"|\"$", "");
            if (!id.isEmpty()) result.add(id);
        }
        return result;
    }
}
