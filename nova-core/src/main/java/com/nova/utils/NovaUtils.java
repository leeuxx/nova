package com.nova.utils;

import com.nova.annotation.Nova;
import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.Layout;
import com.nova.annotation.sub.nova.row.ExprBool;
import com.nova.annotation.sub.nova.row.RowOperation;
import com.nova.config.NovaApplication;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.*;
import java.util.stream.Collectors;

public class NovaUtils {

    /**
     * 获取布局信息
     *
     * @param className 类名
     * @return 布局信息
     */
    public static LayoutInfo getLayout(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return new LayoutInfo();
        }
        Nova nova = scanNova.getNova();
        Layout layout = nova.layout();
        return new LayoutInfo()
                .setEditLayout(layout.editLayout())
                .setPageSize(layout.pageSize())
                .setPageSizes(Arrays.stream(layout.pageSizes()).boxed().collect(Collectors.toList()));
    }

    /**
     * 获取排序信息
     *
     * @param className 类名
     * @return 排序信息
     */
    public static String getOrderBy(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return null;
        }
        return scanNova.getNova().orderBy();
    }

    /**
     * 获取自定义按钮信息
     *
     * @param className 类名
     * @return 自定义按钮信息
     */
    public static List<RowOperation> getRowOperation(String className) {
        NovaApplication.ScanNova scanNova = NovaApplication.getScanNovas().get(className);
        if (scanNova == null) {
            return Collections.emptyList();
        }
        List<RowOperation> result = new ArrayList<>();
        for (RowOperation operation : scanNova.getRowOperations()) {
            ExprBool exprBool = operation.show();
            if (!exprBool.value()) {
                continue;
            }
            Class<? extends ExprBool.ExprHandler>[] handlers = exprBool.exprHandler();
            if (handlers.length == 0) {
                result.add(operation);
                continue;
            }
            String params = exprBool.params();
            for (Class<? extends ExprBool.ExprHandler> handlerClass : handlers) {
                ExprBool.ExprHandler handler = SpringBeanUtils.getBean(handlerClass);
                if (handler.handler(params)) {
                    result.add(operation);
                    break;
                }
            }
        }
        return result;
    }

    @Data
    @Accessors(chain = true)
    public static class LayoutInfo {

        @Comment("编辑布局")
        private Layout.EditLayout editLayout;

        @Comment("分页大小")
        private Integer pageSize;

        @Comment("可选分页数")
        private List<Integer> pageSizes;

    }

}
