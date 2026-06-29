package com.nova.utils;

import com.nova.annotation.fun.DataProxy;
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
            } catch (NoSuchFieldException ignored) {
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
     * 设置 REFERENCE 类型字段（构造嵌套对象并赋值）
     */
    @SneakyThrows
    public static void setReferenceField(String novaName, Object model, String fieldName, String value) {
        Map<String, NovaFieldUtils.ReferenceTypeInfo> refs = NovaFieldUtils.getReference(novaName);
        NovaFieldUtils.ReferenceTypeInfo refInfo = refs.get(fieldName);
        if (refInfo == null) return;
        Field modelField = model.getClass().getDeclaredField(fieldName);
        modelField.setAccessible(true);
        if (value == null || value.isEmpty()) {
            modelField.set(model, null);
            return;
        }
        Class<?> refClass = refInfo.getReferenceClass();
        Object refInstance = refClass.getDeclaredConstructor().newInstance();
        Field storageF = refClass.getDeclaredField(refInfo.getStorageField());
        storageF.setAccessible(true);
        storageF.set(refInstance, convertValue(value, storageF.getType()));
        modelField.set(model, refInstance);
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
}
