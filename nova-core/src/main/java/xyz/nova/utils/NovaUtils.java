package xyz.nova.utils;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.config.Comment;
import xyz.nova.annotation.sub.nova.Drill;
import xyz.nova.annotation.sub.nova.Layout;
import xyz.nova.annotation.sub.nova.TreeType;
import xyz.nova.annotation.sub.nova.row.ExprBool;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.config.NovaApplication;

import java.util.*;
import java.util.stream.Collectors;

public class NovaUtils {

    /**
     * 获取树形结构信息
     *
     * @param className 类名
     * @return 树结构信息
     */
    public static TreeType tree(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return null;
        }
        Nova nova = scanNova.getNova();
        return nova.tree();
    }

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

    /**
     * 获取数据钻取信息
     *
     * @param className 类名
     * @return 钻取信息
     */
    public static List<DrillInfo> getDrill(String className) {
        NovaApplication.ScanNova scanNova = NovaApplication.getScanNovas().get(className);
        if (scanNova == null) {
            return Collections.emptyList();
        }
        List<DrillInfo> drillInfos = new ArrayList<>();
        Nova nova = scanNova.getNova();
        Drill[] drills = nova.drills();
        for (Drill drill : drills) {
            if (drill.show()) {
                boolean show = exprBool(true, drill.showBy());
                if (show) {
                    Drill.Link link = drill.link();
                    DrillInfo drillInfo = new DrillInfo()
                            .setDualTableTitle(drill.title())
                            .setLinkNova(link.linkNova())
                            .setColumn(link.column())
                            .setJoinColumn(link.joinColumn());
                    drillInfos.add(drillInfo);
                }
            }
        }
        return drillInfos;
    }

    /**
     * 获取权限验证
     * @param className 类名
     * @return 是否需要权限验证
     */
    public static Boolean getPower(String className) {
        NovaApplication.ScanNova scanNova = NovaApplication.getScanNovas().get(className);
        if (scanNova == null) {
            return true;
        }
        return scanNova.getNova().power();
    }

    public static boolean exprBool(boolean show, ExprBool exprBool) {
        if (!show || !exprBool.value()) {
            return false;
        }
        Class<? extends ExprBool.ExprHandler>[] exprHandlers = exprBool.exprHandler();
        if (exprHandlers.length > 0) {
            String params = exprBool.params();
            for (Class<? extends ExprBool.ExprHandler> exprHandler : exprHandlers) {
                ExprBool.ExprHandler service = SpringBeanUtils.getBean(exprHandler);
                return service.handler(params);
            }
            return false;
        } else {
            return true;
        }
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

    @Data
    @Accessors(chain = true)
    public static class DrillInfo {

        @Comment("双表视图标题")
        private String dualTableTitle;

        @Comment("关联类")
        private Class<?> linkNova;

        @Comment("当前类关联属性")
        private String column;

        @Comment("目标类关联属性")
        private String joinColumn;

    }
}
