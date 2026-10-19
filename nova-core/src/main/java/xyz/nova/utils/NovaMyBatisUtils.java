package xyz.nova.utils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.NovaField;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.edit.ChoiceType;
import xyz.nova.config.NovaApplication;
import xyz.nova.entity.data.Fetch;
import xyz.nova.entity.data.NovaExpr;
import xyz.nova.entity.data.OrderItemBean;
import xyz.nova.entity.data.Tree;
import xyz.nova.error.NovaException;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

/**
 * MyBatis-Plus 查询构造工具
 */
public class NovaMyBatisUtils {

    /**
     * 根据 Fetch 请求构造 LambdaQueryWrapper 和 Page
     *
     * @param novaClass @Nova 注解所在类
     * @param fetch     框架传入的查询请求
     */
    public static <T> Result<T> buildWrapper(Class<?> novaClass, Fetch<?> fetch) {
        String novaName = novaClass.getSimpleName();
        QueryWrapper<T> wrapper = new QueryWrapper<>();
        Object condition = fetch.getCondition();
        if (condition != null) {
            Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
            NovaApplication.ScanNova scanNova = scanNovas.get(novaName);
            if (scanNova == null) {
                throw new NovaException("Nova class does not exist: " + novaName);
            }
            Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
            // 关联列：REFERENCE的ref、APPENDAGE/APPENDAGES的by, 一律按列精确匹配
            List<String> assocColumns = scanNova.getAssocColumns();
            reflectConditions(condition).forEach((key, value) -> {
                NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo = novaFields.get(key);
                applyCondition(wrapper, MixUtils.camelToSnake(key), value, novaFieldInfo, assocColumns.contains(key));
            });
            applyExprs(wrapper, condition, novaFields);
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
                .setPage(new Page<>(fetch.getCurrent(), fetch.getSize()))
                .setWrapper(wrapper.lambda());
    }

    /**
     * 根据 Tree 构造 LambdaQueryWrapper
     *
     * @param novaClass @Nova 注解所在类
     * @param tree      框架传入的查询请求
     */
    public static <T> LambdaQueryWrapper<T> buildWrapper(Class<?> novaClass, Tree tree) {
        String novaName = novaClass.getSimpleName();
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
        Field exprField = NovaFieldUtils.findExprField(condition.getClass());
        for (Field f : condition.getClass().getDeclaredFields()) {
            // AI 表达式集合字段由 applyExprs 单独处理，不进入普通条件映射
            if (f.equals(exprField)) {
                continue;
            }
            f.setAccessible(true);
            try {
                Object value = f.get(condition);
                if (value != null) {
                    map.put(f.getName(), value);
                }
            } catch (IllegalAccessException e) {
                throw new NovaException("Failed to read query condition property: " + f);
            }
        }
        return map;
    }

    private static <T> void applyCondition(QueryWrapper<T> wrapper, String column, Object value, NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo, boolean assocColumn) {
        // 统一前置判空
        if (value == null) {
            return;
        }
        // 关联列（REFERENCE的ref、APPENDAGE/APPENDAGES的by）：按列精确匹配，避免撞上字段类型干扰
        if (assocColumn) {
            applyExactMatch(wrapper, column, value);
            return;
        }
        // 非Nova字段（其他）：按列精确匹配
        if (novaFieldInfo == null) {
            applyExactMatch(wrapper, column, value);
            return;
        }
        NovaField novaField = novaFieldInfo.getNovaField();
        Edit edit = novaField.edit();
        Edit.Type type = novaFieldInfo.getType();
        // LINK/LINK_TARGET 跨表条件：当前表直接过滤无意义
        if (Edit.Type.LINK.equals(type) || Edit.Type.LINK_TARGET.equals(type)) {
            return;
        }
        // 文本类型（INPUT / TEXTAREA），支持模糊查询
        if (Edit.Type.INPUT.equals(type) || Edit.Type.TEXTAREA.equals(type)) {
            Object v = value instanceof List<?> list ? list.get(0) : value;
            if (edit.search().vague()) {
                wrapper.like(column, v);
            } else {
                wrapper.eq(column, v);
            }
            return;
        }
        // 数字类型（NUMBER）：2 元素 List 视为区间 [lo,hi]，单值按精确匹配
        if (Edit.Type.NUMBER.equals(type)) {
            List<?> list = value instanceof List<?> l ? l : Collections.singletonList(value);
            if (list.size() == 2) {
                Object lo = list.get(0);
                Object hi = list.get(1);
                if (lo != null) {
                    wrapper.ge(column, lo);
                }
                if (hi != null) {
                    wrapper.le(column, hi);
                }
            } else {
                wrapper.eq(column, list.get(0));
            }
            return;
        }
        // 选择类型（CHOICE）：scalar 归一为单元素 List，语义由 SelectType 决定
        if (Edit.Type.CHOICE.equals(type)) {
            List<?> list = value instanceof List<?> l ? l : Collections.singletonList(value);
            if (edit.choiceType().selectType() == ChoiceType.SelectType.MULTI) {
                applyFindInSet(wrapper, column, list);
            } else if (list.size() > 1) {
                wrapper.in(column, list);
            } else {
                wrapper.eq(column, list.get(0));
            }
            return;
        }
        // 标签类型（TAG）：scalar 归一为单元素 List
        if (Edit.Type.TAG.equals(type)) {
            List<?> list = value instanceof List<?> l ? l : Collections.singletonList(value);
            applyFindInSet(wrapper, column, list);
            return;
        }
        // 日期类型（DATE）：2 元素 List 视为区间 [start,end]，单值按精确匹配
        if (Edit.Type.DATE.equals(type)) {
            String dateType = edit.dateType().type().name();
            List<?> list = value instanceof List<?> l ? l : Collections.singletonList(value);
            if (list.size() == 2) {
                Object start = list.get(0);
                Object end = list.get(1);
                if (start != null) {
                    wrapper.ge(column, formatDate(start, dateType));
                }
                if (end != null) {
                    wrapper.le(column, formatDate(end, dateType));
                }
            } else {
                wrapper.eq(column, formatDate(list.get(0), dateType));
            }
            return;
        }
        // 布尔类型（BOOLEAN）
        if (Edit.Type.BOOLEAN.equals(type)) {
            wrapper.eq(column, value instanceof List<?> list ? list.get(0) : value);
            return;
        }
        // 其余组件类型无合法查询列（ATTACHMENT/BUTTON/DIVIDE/EMPTY，key 恰好是 REFERENCE/APPENDAGE 字段名，或未成功解析的 AUTO）：显式报错，不静默丢弃
        throw new NovaException("Unsupported query component type '" + type + "' for column '" + column + "'");
    }

    /**
     * 应用 AI 表达式条件；子表属性（对象.属性）由开发者在 DataProxy 中自行处理
     */
    private static <T> void applyExprs(QueryWrapper<T> wrapper, Object condition,
                                       Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields) {
        Field exprField = NovaFieldUtils.findExprField(condition.getClass());
        if (exprField == null) {
            return;
        }
        Object value;
        try {
            exprField.setAccessible(true);
            value = exprField.get(condition);
        } catch (IllegalAccessException e) {
            throw new NovaException("Failed to read AI expression condition property: " + exprField);
        }
        if (value == null) {
            return;
        }
        for (NovaExpr expr : (List<NovaExpr>) value) {
            String field = expr.getField();
            // 子表属性（对象.属性）：由开发者自行解析
            if (field.indexOf('.') >= 0) {
                continue;
            }
            NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo = novaFields.get(field);
            if (novaFieldInfo == null) {
                throw new NovaException("Unknown AI expression field: " + field);
            }
            applyExpr(wrapper, expr, novaFieldInfo);
        }
    }

    private static <T> void applyExpr(QueryWrapper<T> wrapper, NovaExpr expr,
                                      NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo) {
        String field = expr.getField();
        String column = MixUtils.camelToSnake(field);
        Edit.Type type = novaFieldInfo.getType();
        // LINK/LINK_TARGET 跨表字段无本地列，无法在此过滤
        if (Edit.Type.LINK.equals(type) || Edit.Type.LINK_TARGET.equals(type)) {
            return;
        }
        // 引用/附属字段必须通过「对象.属性」表达，顶层字段名没有对应列
        if (Edit.Type.REFERENCE.equals(type) || Edit.Type.APPENDAGE.equals(type) || Edit.Type.APPENDAGES.equals(type)) {
            throw new NovaException("AI expression field '" + field + "' must use a sub attribute (field.column)");
        }
        List<Object> values = new ArrayList<>();
        if (expr.getValues() != null) {
            for (String raw : expr.getValues()) {
                values.add(convertExprValue(raw, novaFieldInfo));
            }
        }
        // 标签/多选列以逗号分隔存储，等值/成员判断走 FIND_IN_SET
        if (Edit.Type.TAG.equals(type)
                || (Edit.Type.CHOICE.equals(type)
                && novaFieldInfo.getNovaField().edit().choiceType().selectType() == ChoiceType.SelectType.MULTI)) {
            applySetExpr(wrapper, column, expr.getOp(), values);
            return;
        }
        NovaExpr.Op op = expr.getOp();
        switch (op) {
            case EQ -> wrapper.eq(column, singleValue(op, values));
            case NE -> wrapper.ne(column, singleValue(op, values));
            case GT -> wrapper.gt(column, singleValue(op, values));
            case GE -> wrapper.ge(column, singleValue(op, values));
            case LT -> wrapper.lt(column, singleValue(op, values));
            case LE -> wrapper.le(column, singleValue(op, values));
            case LIKE -> wrapper.like(column, singleValue(op, values));
            case BETWEEN -> {
                requireCount(op, values, 2);
                wrapper.between(column, values.get(0), values.get(1));
            }
            case IN -> {
                if (values.isEmpty()) {
                    throw new NovaException("AI expression operator 'in' requires at least 1 value");
                }
                wrapper.in(column, values);
            }
            case IS_NULL -> wrapper.isNull(column);
            case IS_NOT_NULL -> wrapper.isNotNull(column);
        }
    }

    /**
     * 标签/多选列（逗号分隔存储）的表达式：等值/不等于/成员判断走 FIND_IN_SET
     */
    private static <T> void applySetExpr(QueryWrapper<T> wrapper, String column, NovaExpr.Op op, List<Object> values) {
        switch (op) {
            case EQ -> wrapper.apply("FIND_IN_SET({0}, " + column + ") > 0", singleValue(op, values));
            case NE -> wrapper.apply("FIND_IN_SET({0}, " + column + ") = 0", singleValue(op, values));
            case LIKE -> wrapper.like(column, singleValue(op, values));
            case IN -> {
                if (values.isEmpty()) {
                    throw new NovaException("AI expression operator 'in' requires at least 1 value");
                }
                wrapper.and(w -> {
                    for (int i = 0; i < values.size(); i++) {
                        if (i == 0) w.apply("FIND_IN_SET({0}, " + column + ") > 0", values.get(i));
                        else w.or().apply("FIND_IN_SET({0}, " + column + ") > 0", values.get(i));
                    }
                });
            }
            case IS_NULL -> wrapper.isNull(column);
            case IS_NOT_NULL -> wrapper.isNotNull(column);
            default -> throw new NovaException("AI expression operator '" + op.name().toLowerCase()
                    + "' is not supported on set column '" + column + "'");
        }
    }

    private static Object singleValue(NovaExpr.Op op, List<Object> values) {
        requireCount(op, values, 1);
        return values.get(0);
    }

    private static void requireCount(NovaExpr.Op op, List<Object> values, int expected) {
        if (values.size() != expected) {
            throw new NovaException("AI expression operator '" + op.name().toLowerCase()
                    + "' requires exactly " + expected + " value(s)");
        }
    }

    /**
     * AI 表达式值原样为字符串，按字段类型转换：NUMBER 转数值，BOOLEAN 仅接受 true/false，
     * DATE 统一按 yyyy-MM-dd 解析后套用字段声明的 dateType 格式
     */
    private static Object convertExprValue(String value, NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo) {
        Edit.Type type = novaFieldInfo.getType();
        if (Edit.Type.NUMBER.equals(type)) {
            try {
                return new BigDecimal(value);
            } catch (NumberFormatException e) {
                throw new NovaException("Invalid numeric AI expression value: '" + value + "'");
            }
        }
        if (Edit.Type.BOOLEAN.equals(type)) {
            if ("true".equalsIgnoreCase(value)) {
                return true;
            }
            if ("false".equalsIgnoreCase(value)) {
                return false;
            }
            throw new NovaException("Invalid boolean AI expression value: '" + value + "'");
        }
        if (Edit.Type.DATE.equals(type)) {
            LocalDate date;
            try {
                date = LocalDate.parse(value);
            } catch (DateTimeParseException e) {
                throw new NovaException("Invalid date AI expression value: '" + value + "'");
            }
            String dateType = novaFieldInfo.getNovaField().edit().dateType().type().name();
            return switch (dateType) {
                case "DATE" -> date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                case "YEAR_MONTH" -> date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                case "YEAR" -> date.format(DateTimeFormatter.ofPattern("yyyy"));
                default -> date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            };
        }
        return value;
    }

    /**
     * 按列精确匹配：List 多值用 in，单值用 eq
     */
    private static <T> void applyExactMatch(QueryWrapper<T> wrapper, String column, Object value) {
        if (value instanceof List<?> list) {
            if (list.size() > 1) {
                wrapper.in(column, list);
            } else {
                wrapper.eq(column, list.get(0));
            }
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
        if (date instanceof YearMonth ym) {
            return ym.format(formatter);
        }
        if (date instanceof Year y) {
            return y.format(formatter);
        }
        throw new NovaException("Failed to format date condition value: '" + date + "'");
    }

    @Data
    @Accessors(chain = true)
    public static class Result<T> {

        private Page<T> page;

        private LambdaQueryWrapper<T> wrapper;

    }
}
