package com.nova.utils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.nova.entity.data.Fetch;
import com.nova.entity.data.Tree;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.edit.ChoiceType;
import lombok.Data;
import lombok.experimental.Accessors;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
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
        Map<String, Fetch.Search> conditions = fetch.getConditions();
        if (conditions != null) {
            Map<String, NovaFieldUtils.DateInfo> dateMap = NovaFieldUtils.getDate(novaName);
            conditions.forEach((field, search) -> applyCondition(
                    wrapper, novaName, field,
                    MixUtils.camelToSnake(field),
                    search.getValue(), search.getType(),
                    Boolean.TRUE.equals(search.getVague()),
                    dateMap.get(field)
            ));
        }
        List<Fetch.OrderItemBean> orders = fetch.getOrders();
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
        List<Tree.OrderItemBean> orders = tree.getOrders();
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

    private static <T> void applyCondition(QueryWrapper<T> wrapper, String novaName, String field,
                                           String column, String value, String type, boolean vague,
                                           NovaFieldUtils.DateInfo dateInfo) {
        if (Edit.Type.DATE.name().equals(type)) {
            String dateType = dateInfo != null ? dateInfo.getType().name() : "DATETIME";
            if (vague && value != null && value.contains(",")) {
                String[] parts = value.split(",", 2);
                wrapper.ge(column, msToStr(parts[0], dateType)).le(column, msToStr(parts[1], dateType));
            } else if (value != null && !value.isEmpty()) {
                wrapper.eq(column, msToStr(value, dateType));
            }
        } else if (Edit.Type.CHOICE.name().equals(type)) {
            ChoiceType.SelectType selectType = NovaFieldUtils.getChoiceSelectType(novaName, field);
            if (selectType == ChoiceType.SelectType.MULTI) {
                List<String> vals = value != null && !value.isEmpty() ? Arrays.asList(value.split(",")) : List.of();
                if (!vals.isEmpty()) wrapper.and(w -> {
                    for (int i = 0; i < vals.size(); i++) {
                        String v = vals.get(i).trim();
                        if (i == 0) w.apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                        else w.or().apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                    }
                });
            } else if (vague && value != null && value.contains(",")) {
                wrapper.in(column, Arrays.asList(value.split(",")));
            } else if (value != null && !value.isEmpty()) {
                wrapper.eq(column, value);
            }
        } else if (Edit.Type.NUMBER.name().equals(type)) {
            if (vague && value != null && value.contains(",")) {
                String[] parts = value.split(",", 2);
                String lo = parts[0].trim(), hi = parts[1].trim();
                if (!lo.isEmpty()) wrapper.ge(column, new BigDecimal(lo));
                if (!hi.isEmpty()) wrapper.le(column, new BigDecimal(hi));
            } else if (value != null && !value.isEmpty()) {
                wrapper.eq(column, new BigDecimal(value));
            }
        } else if (Edit.Type.TAG.name().equals(type)) {
            List<String> vals = value != null && !value.isEmpty() ? Arrays.asList(value.split(",")) : List.of();
            if (!vals.isEmpty()) wrapper.and(w -> {
                for (int i = 0; i < vals.size(); i++) {
                    String v = vals.get(i).trim();
                    if (i == 0) w.apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                    else w.or().apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                }
            });
        } else if (Edit.Type.BOOLEAN.name().equals(type)) {
            if (value != null && !value.isEmpty()) wrapper.eq(column, Boolean.parseBoolean(value));
        } else {
            if (vague && value != null && !value.isEmpty()) wrapper.like(column, value);
            else if (value != null && !value.isEmpty()) wrapper.eq(column, value);
        }
    }

    private static String msToStr(String ms, String dateType) {
        String pattern = switch (dateType) {
            case "DATE" -> "yyyy-MM-dd";
            case "YEAR_MONTH" -> "yyyy-MM";
            case "YEAR" -> "yyyy";
            default -> "yyyy-MM-dd HH:mm:ss";
        };
        return Instant.ofEpochMilli(Long.parseLong(ms.trim()))
                .atZone(ZoneId.systemDefault()).toLocalDateTime()
                .format(DateTimeFormatter.ofPattern(pattern));
    }

    @Data
    @Accessors(chain = true)
    public static class Result<T> {
        private Page<T> page;
        private LambdaQueryWrapper<T> wrapper;
    }
}
