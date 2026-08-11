package xyz.nova.utils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.edit.ChoiceType;
import xyz.nova.config.NovaApplication;
import xyz.nova.entity.data.Fetch;
import xyz.nova.entity.data.OrderItemBean;
import xyz.nova.entity.data.Tree;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MyBatis-Plus 查询构造工具
 */
public class NovaQueryUtils {

    /**
     * 根据 Fetch 请求构造 LambdaQueryWrapper 和 Page
     *
     * @param viewClass View 类（@Nova 注解所在类，用于读取字段元数据）
     * @param fetch     框架传入的查询请求
     */
    public static <T> Result<T> buildWrapper(Class<?> viewClass, Fetch fetch) {
        String novaName = viewClass.getSimpleName();
        QueryWrapper<T> wrapper = new QueryWrapper<>();
        Object condition = fetch.getCondition();
        if (condition != null) {
            Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
            NovaApplication.ScanNova scanNova = scanNovas.get(novaName);
            if (scanNova == null) {
                throw new RuntimeException("Nova类不存在");
            }
            Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
            Map<String, NovaFieldUtils.DateInfo> dateMap = NovaFieldUtils.getDate(novaName);
            reflectConditions(condition).forEach((key, value) -> {
                NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo = novaFields.get(key);
                boolean vague = false;
                Edit.Type type = null;
                if (novaFieldInfo != null) {
                    vague = novaFieldInfo.getNovaField().edit().search().vague();
                    type = novaFieldInfo.getType();
                }
                applyCondition(wrapper, novaName, key,
                        MixUtils.camelToSnake(key),
                        value, type, vague,
                        dateMap.get(key));
            });
        }
        List<OrderItemBean> orders = fetch.getOrders();
        if (orders != null && !orders.isEmpty()) {
            orders.forEach(o -> {
                if (o.isAsc()) wrapper.orderByAsc(o.getColumn());
                else wrapper.orderByDesc(o.getColumn());
            });
        } else {
            String defaultOrderBy = NovaUtils.getOrderBy(novaName);
            if (defaultOrderBy != null && !defaultOrderBy.isBlank()) {
                wrapper.last("ORDER BY " + defaultOrderBy);
            }
        }
        return new Result<T>()
                .setPage(Page.of(fetch.getCurrent(), fetch.getSize()))
                .setWrapper(wrapper.lambda());
    }

    /**
     * 根据 Tree 构造 LambdaQueryWrapper
     *
     * @param viewClass View 类（@Nova 注解所在类，用于读取字段元数据）
     * @param tree      框架传入的查询请求
     */
    public static <T> LambdaQueryWrapper<T> buildWrapper(Class<?> viewClass, Tree tree) {
        String novaName = viewClass.getSimpleName();
        QueryWrapper<T> wrapper = new QueryWrapper<>();
        List<OrderItemBean> orders = tree.getOrders();
        if (orders != null && !orders.isEmpty()) {
            orders.forEach(o -> {
                if (o.isAsc()) wrapper.orderByAsc(o.getColumn());
                else wrapper.orderByDesc(o.getColumn());
            });
        } else {
            String defaultOrderBy = NovaUtils.getOrderBy(novaName);
            if (defaultOrderBy != null && !defaultOrderBy.isBlank()) {
                wrapper.last("ORDER BY " + defaultOrderBy);
            }
        }
        return wrapper.lambda();
    }

    /**
     * 反射读取查询条件实体已赋值的属性
     */
    private static Map<String, Object> reflectConditions(Object condition) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (Field f : condition.getClass().getDeclaredFields()) {
            f.setAccessible(true);
            try {
                Object value = f.get(condition);
                if (value != null) {
                    map.put(f.getName(), value);
                }
            } catch (IllegalAccessException e) {
                throw new RuntimeException("读取查询条件属性失败: " + f.getName(), e);
            }
        }
        return map;
    }

    private static <T> void applyCondition(QueryWrapper<T> wrapper, String novaName, String field, String column, Object value, Edit.Type type, boolean vague, NovaFieldUtils.DateInfo dateInfo) {
        // 统一前置判空
        if (value == null) {
            return;
        }
        // LINK/LINK_TARGET 跨表条件：当前表直接过滤无意义
        if (Edit.Type.LINK.equals(type) || Edit.Type.LINK_TARGET.equals(type)) {
            return;
        }
        // 文本类型（INPUT / TEXTAREA），支持模糊查询
        if (Edit.Type.INPUT.equals(type) || Edit.Type.TEXTAREA.equals(type)) {
            if (vague) {
                wrapper.like(column, value);
            } else {
                wrapper.eq(column, value);
            }
            return;
        }
        // 数字类型（NUMBER）：vague 区间为 List[lo,hi]，非区间为单值
        if (Edit.Type.NUMBER.equals(type)) {
            if (vague) {
                List<?> list = (List<?>) value;
                Object lo = list.get(0);
                Object hi = list.get(1);
                if (lo != null) wrapper.ge(column, lo);
                if (hi != null) wrapper.le(column, hi);
            } else {
                wrapper.eq(column, value instanceof List<?> list ? list.get(0) : value);
            }
            return;
        }
        // 选择类型（CHOICE）
        if (Edit.Type.CHOICE.equals(type)) {
            ChoiceType.SelectType selectType = NovaFieldUtils.getChoiceSelectType(novaName, field);
            if (selectType == ChoiceType.SelectType.MULTI) {
                if (value instanceof List<?> list) {
                    applyFindInSet(wrapper, column, list);
                } else {
                    wrapper.apply("FIND_IN_SET({0}, " + column + ") > 0", value);
                }
            } else if (vague) {
                List<?> list = value instanceof List<?> l ? l : Collections.singletonList(value);
                wrapper.in(column, list);
            } else {
                wrapper.eq(column, value instanceof List<?> list ? list.get(0) : value);
            }
            return;
        }
        // 标签类型（TAG）
        if (Edit.Type.TAG.equals(type)) {
            if (value instanceof List<?> list) {
                applyFindInSet(wrapper, column, list);
            } else {
                wrapper.apply("FIND_IN_SET({0}, " + column + ") > 0", value);
            }
            return;
        }
        // 日期类型（DATE）：vague 区间为 List，非区间为单值
        if (Edit.Type.DATE.equals(type)) {
            String dateType = dateInfo != null ? dateInfo.getType().name() : "DATETIME";
            if (vague) {
                List<?> list = (List<?>) value;
                Object start = list.get(0);
                Object end = list.get(1);
                if (start != null) wrapper.ge(column, formatDate(start, dateType));
                if (end != null) wrapper.le(column, formatDate(end, dateType));
            } else {
                wrapper.eq(column, formatDate(value instanceof List<?> list ? list.get(0) : value, dateType));
            }
            return;
        }
        // 布尔类型（BOOLEAN）
        if (Edit.Type.BOOLEAN.equals(type)) {
            wrapper.eq(column, value instanceof List<?> list ? list.get(0) : value);
            return;
        }
        // 空兜底精确匹配（REFERENCE 的 ref、APPENDAGE/APPENDAGES 的 by、type==null 未知列等）
        if (value instanceof List<?> list) {
            wrapper.in(column, list);
        } else {
            wrapper.eq(column, value);
        }
    }

    private static <T> void applyFindInSet(QueryWrapper<T> wrapper, String column, List<?> list) {
        wrapper.and(w -> {
            for (int i = 0; i < list.size(); i++) {
                Object v = list.get(i);
                if (i == 0) w.apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                else w.or().apply("FIND_IN_SET({0}, " + column + ") > 0", v);
            }
        });
    }

    private static String formatDate(Object date, String dateType) {
        String pattern = switch (dateType) {
            case "DATE" -> "yyyy-MM-dd";
            case "YEAR_MONTH" -> "yyyy-MM";
            case "YEAR" -> "yyyy";
            default -> "yyyy-MM-dd HH:mm:ss";
        };
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
        if (date instanceof LocalDateTime ldt) {
            return ldt.format(formatter);
        }
        if (date instanceof LocalDate ld) {
            return ld.format(formatter);
        }
        if (date instanceof Date d) {
            return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime().format(formatter);
        }
        throw new RuntimeException("无法格式化日期条件值: " + date);
    }

    @Data
    @Accessors(chain = true)
    public static class Result<T> {

        private Page<T> page;

        private LambdaQueryWrapper<T> wrapper;

    }
}
