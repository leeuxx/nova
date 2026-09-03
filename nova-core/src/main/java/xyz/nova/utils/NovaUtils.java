package xyz.nova.utils;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.Nova;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.*;
import xyz.nova.annotation.sub.nova.row.ExprBool;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.config.NovaApplication;
import xyz.nova.i18n.NovaI18nUtils;

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
            Class<? extends ExprBool.ExprHandler> handlers = exprBool.exprHandler();
            if (handlers == ExprBool.ExprHandler.class) {
                result.add(operation);
                continue;
            }
            String param = exprBool.param();
            ExprBool.ExprHandler handler = SpringBeanUtils.getBean(handlers);
            if (handler.handler(param)) {
                result.add(operation);
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
            boolean show = exprBool(true, drill.show());
            if (show) {
                Drill.Link link = drill.link();
                DrillInfo drillInfo = new DrillInfo()
                        .setDualTableTitle(NovaI18nUtils.get(drill.title(), NovaI18nUtils.SourceType.ANNOTATE))
                        .setLinkNova(link.linkNova())
                        .setColumn(link.column())
                        .setJoinColumn(link.joinColumn());
                drillInfos.add(drillInfo);
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

    /**
     * 获取双表视图表列压缩系数
     * @param className 类名
     * @return 双表视图表列压缩系数
     */
    public static Double getDualShrink(String className) {
        NovaApplication.ScanNova scanNova = NovaApplication.getScanNovas().get(className);
        if (scanNova == null) {
            return 1D;
        }
        double dualShrink = scanNova.getNova().dualShrink();
        return dualShrink <= 0 || dualShrink > 1 ? 1D : dualShrink;
    }

    /**
     * 获取提示信息
     *
     * @param className 类名
     * @return 提示信息
     */
    public static TooltipInfo getTooltip(String className) {
        TooltipInfo tooltipInfo = new TooltipInfo();
        NovaApplication.ScanNova scanNova = NovaApplication.getScanNovas().get(className);
        if (scanNova == null) {
            return tooltipInfo;
        }
        Nova nova = scanNova.getNova();
        Tooltip tooltip = nova.tooltip();
        tooltipInfo.setValue(tooltip.value());
        Class<? extends TooltipHandler> tooltipHandler = tooltip.tooltipHandler();
        if(tooltipHandler != TooltipHandler.class) {
            TooltipHandler service = SpringBeanUtils.getBean(tooltipHandler);
            String value = service.getTooltip(tooltip.value());
            tooltipInfo.setValue(value);
        }
        return tooltipInfo;
    }

    public static boolean exprBool(boolean show, ExprBool exprBool) {
        if (!show || !exprBool.value()) {
            return false;
        }
        Class<? extends ExprBool.ExprHandler> exprHandlers = exprBool.exprHandler();
        if (exprHandlers != ExprBool.ExprHandler.class) {
            String param = exprBool.param();
            ExprBool.ExprHandler service = SpringBeanUtils.getBean(exprHandlers);
            return service.handler(param);
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

    @Data
    @Accessors(chain = true)
    public static class TooltipInfo {

        @Comment("提示内容")
        private String value;

    }

}
