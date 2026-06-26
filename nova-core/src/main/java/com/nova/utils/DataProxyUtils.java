package com.nova.utils;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.fun.FetchRequest;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.edit.ChoiceType;
import com.nova.config.NovaApplication;
import lombok.SneakyThrows;
import org.springframework.core.convert.ConversionService;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class DataProxyUtils {

    /**
     * 获取数据代理类
     *
     * @param className 类名
     * @return 数据代理
     */
    public static DataProxy<?, ?> getDataProxy(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return null;
        }
        return SpringBeanUtils.getBean(scanNova.getDataProxyClass());
    }

    /**
     * 构建 FetchRequest.Search
     *
     * @param novaName     novaName
     * @param field        字段名
     * @param column       数据库字段名
     * @param value        值
     * @param type         类型
     * @param vague        高级查询
     * @param dateInfo     日期时间参数
     * @param queryWrapper 查询条件
     * @return FetchRequest.Search
     */
    public static FetchRequest.Source.Search buildFetchSearch(String novaName, String field, String column, String value, String type, boolean vague, NovaFieldUtils.DateInfo dateInfo,
                                                              QueryWrapper<Object> queryWrapper) {
        FetchRequest.Source.Search search = new FetchRequest.Source.Search()
                .setValue(value)
                .setType(type)
                .setVague(vague);
        if (Edit.Type.DATE.name().equals(type)) {
            String dateType = dateInfo.getType().name();
            if (vague && value != null && value.contains(",")) {
                // 范围查询：value = "ms1,ms2"
                String[] parts = value.split(",", 2);
                queryWrapper.ge(column, msToSqlStr(parts[0], dateType)).le(column, msToSqlStr(parts[1], dateType));
            } else if (value != null && !value.isEmpty()) {
                queryWrapper.eq(column, msToSqlStr(value, dateType));
            }
        } else if (Edit.Type.CHOICE.name().equals(type)) {
            ChoiceType.SelectType selectType = NovaFieldUtils.getChoiceSelectType(novaName, field);
            if (selectType == ChoiceType.SelectType.MULTI) {
                // DB 存 "1,2,3"，用 FIND_IN_SET OR 匹配用户选中的每个值
                List<String> vals = (value != null && !value.isEmpty())
                        ? Arrays.asList(value.split(",")) : List.of();
                if (!vals.isEmpty()) {
                    queryWrapper.and(w -> {
                        for (int i = 0; i < vals.size(); i++) {
                            String v = vals.get(i).trim();
                            if (i == 0) w.apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                            else w.or().apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                        }
                    });
                }
            } else {
                // SINGLE：vague=true 时多值 IN，vague=false 时精确 EQ
                if (vague && value != null && value.contains(",")) {
                    List<String> vals = Arrays.asList(value.split(","));
                    queryWrapper.in(column, vals);
                } else if (value != null && !value.isEmpty()) {
                    queryWrapper.eq(column, value);
                }
            }
        } else if (Edit.Type.NUMBER.name().equals(type)) {
            if (vague && value != null && value.contains(",")) {
                String[] parts = value.split(",", 2);
                String lo = parts[0].trim(), hi = parts[1].trim();
                if (!lo.isEmpty()) queryWrapper.ge(column, new java.math.BigDecimal(lo));
                if (!hi.isEmpty()) queryWrapper.le(column, new java.math.BigDecimal(hi));
            } else if (value != null && !value.isEmpty()) {
                queryWrapper.eq(column, new java.math.BigDecimal(value));
            }
        } else if (Edit.Type.TAG.name().equals(type)) {
            List<String> vals = (value != null && !value.isEmpty())
                    ? Arrays.asList(value.split(",")) : List.of();
            if (!vals.isEmpty()) {
                queryWrapper.and(w -> {
                    for (int i = 0; i < vals.size(); i++) {
                        String v = vals.get(i).trim();
                        if (i == 0) w.apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                        else w.or().apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                    }
                });
            }
        } else if (Edit.Type.BOOLEAN.name().equals(type)) {
            if (value != null && !value.isEmpty()) {
                queryWrapper.eq(column, Boolean.parseBoolean(value));
            }
        } else {
            // TEXT 及其他：vague=true 模糊，vague=false 精确
            if (vague && value != null && !value.isEmpty()) {
                queryWrapper.like(column, value);
            } else if (value != null && !value.isEmpty()) {
                queryWrapper.eq(column, value);
            }
        }
        return search;
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
     * ms 时间戳转为 SQL 时间字符串
     */
    private static String msToSqlStr(String ms, String dateType) {
        long epoch = Long.parseLong(ms.trim());
        ZoneId zone = ZoneId.systemDefault();
        String pattern = switch (dateType) {
            case "DATE" -> "yyyy-MM-dd";
            case "YEAR_MONTH" -> "yyyy-MM";
            case "YEAR" -> "yyyy";
            default -> "yyyy-MM-dd HH:mm:ss";
        };
        return Instant.ofEpochMilli(epoch).atZone(zone).toLocalDateTime().format(DateTimeFormatter.ofPattern(pattern));
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
