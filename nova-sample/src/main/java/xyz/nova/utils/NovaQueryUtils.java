package xyz.nova.utils;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import lombok.experimental.Accessors;
import lombok.extern.slf4j.Slf4j;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.edit.ChoiceType;
import xyz.nova.config.NovaApplication;
import xyz.nova.entity.data.Fetch;
import xyz.nova.entity.data.OrderItemBean;
import xyz.nova.entity.data.Tree;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * MyBatis-Plus 查询构造工具
 */
@Slf4j
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
        Map<String, String> conditions = new LinkedHashMap<>();
        if (conditions != null) {
            Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
            NovaApplication.ScanNova scanNova = scanNovas.get(novaName);
            if (scanNova == null) {
                throw new RuntimeException("Nova类不存在");
            }
            Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
            Map<String, NovaFieldUtils.DateInfo> dateMap = NovaFieldUtils.getDate(novaName);
            conditions.forEach((key, value) -> {
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

    private static <T> void applyCondition(QueryWrapper<T> wrapper, String novaName, String field, String column, String value, Edit.Type type, boolean vague, NovaFieldUtils.DateInfo dateInfo) {
        // 统一前置判空
        if (value == null || value.isEmpty()) {
            return;
        }
        // 空兜底精确匹配（理论上属于关联类型：REFERENCE / APPENDAGE / APPENDAGES）
        if (type == null) {
            wrapper.eq(column, value);
            return;
        }
        // LINK 跨表条件：当前表直接过滤无意义
        if (Edit.Type.LINK.equals(type)) {
            return;
        }
        // 文本类型（INPUT / TEXTAREA）, 支持模糊查询
        if (Edit.Type.INPUT.equals(type) || Edit.Type.TEXTAREA.equals(type)) {
            if (vague) {
                wrapper.like(column, value);
            } else {
                wrapper.eq(column, value);
            }
            return;
        }
        // 数字类型（NUMBER）
        if (Edit.Type.NUMBER.equals(type)) {
            if (vague && value.contains(",")) {
                String[] parts = value.split(",", 2);
                String lo = parts[0].trim(), hi = parts[1].trim();
                if (!lo.isEmpty()) wrapper.ge(column, new BigDecimal(lo));
                if (!hi.isEmpty()) wrapper.le(column, new BigDecimal(hi));
            } else {
                wrapper.eq(column, new BigDecimal(value));
            }
            return;
        }
        // 选择类型（CHOICE）
        if (Edit.Type.CHOICE.equals(type)) {
            ChoiceType.SelectType selectType = NovaFieldUtils.getChoiceSelectType(novaName, field);
            if (selectType == ChoiceType.SelectType.MULTI) {
                List<String> vals = Arrays.asList(value.split(","));
                if (!vals.isEmpty()) {
                    wrapper.and(w -> {
                        for (int i = 0; i < vals.size(); i++) {
                            String v = vals.get(i).trim();
                            if (i == 0) w.apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                            else w.or().apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                        }
                    });
                }
            } else if (vague && value.contains(",")) {
                wrapper.in(column, Arrays.asList(value.split(",")));
            } else {
                wrapper.eq(column, value);
            }
        }
        // 标签类型（TAG）
        if (Edit.Type.TAG.equals(type)) {
            List<String> vals = Arrays.asList(value.split(","));
            if (!vals.isEmpty()) {
                wrapper.and(w -> {
                    for (int i = 0; i < vals.size(); i++) {
                        String v = vals.get(i).trim();
                        if (i == 0) w.apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                        else w.or().apply("FIND_IN_SET({0}, " + column + ") > 0", v);
                    }
                });
            }
        }
        // 日期类型（DATE）
        if (Edit.Type.DATE.equals(type)) {
            String dateType = dateInfo != null ? dateInfo.getType().name() : "DATETIME";
            if (vague && value.contains(",")) {
                String[] parts = value.split(",", 2);
                wrapper.ge(column, msToStr(parts[0], dateType))
                        .le(column, msToStr(parts[1], dateType));
            } else {
                wrapper.eq(column, msToStr(value, dateType));
            }
            return;
        }
        // 布尔类型（BOOLEAN）
        if (Edit.Type.BOOLEAN.equals(type)) {
            wrapper.eq(column, Boolean.parseBoolean(value));
            return;
        }
        log.warn("未识别组件类型：{}", type.name());
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
