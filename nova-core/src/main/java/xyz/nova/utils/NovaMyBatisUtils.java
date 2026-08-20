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
import xyz.nova.entity.data.OrderItemBean;
import xyz.nova.entity.data.Tree;
import xyz.nova.error.NovaException;

import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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
                throw new NovaException("Nova类不存在");
            }
            Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
            // 关联列：REFERENCE的ref、APPENDAGE/APPENDAGES的by, 一律按列精确匹配
            List<String> assocColumns = scanNova.getAssocColumns();
            reflectConditions(condition).forEach((key, value) -> {
                NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo = novaFields.get(key);
                applyCondition(wrapper, MixUtils.camelToSnake(key), value, novaFieldInfo, assocColumns.contains(key));
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
        for (Field f : condition.getClass().getDeclaredFields()) {
            f.setAccessible(true);
            try {
                Object value = f.get(condition);
                if (value != null) {
                    map.put(f.getName(), value);
                }
            } catch (IllegalAccessException e) {
                throw new NovaException("读取查询条件属性失败: " + f.getName());
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
        throw new NovaException("不支持的查询组件类型: " + type + ", 列: " + column);
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
        throw new NovaException("无法格式化日期条件值: " + date);
    }

    @Data
    @Accessors(chain = true)
    public static class Result<T> {

        private Page<T> page;

        private LambdaQueryWrapper<T> wrapper;

    }
}
