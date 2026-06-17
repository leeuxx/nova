package com.nova.utils;

import com.nova.annotation.Comment;
import com.nova.annotation.Nova;
import com.nova.annotation.sub.Layout;
import com.nova.config.NovaApplication;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
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
                .setEditLayout(layout.editLayout().name())
                .setPageSize(layout.pageSize())
                .setPageSizes(Arrays.stream(layout.pageSizes()).boxed().collect(Collectors.toList()));
    }

    /**
     * 获取SQL构造信息
     *
     * @param className 类名
     * @return SQL构造信息
     */
    public static SqlInfo getSqlInfo(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return new SqlInfo();
        }
        NovaApplication.ScanNova.SqlInfo sqlInfo = scanNova.getSqlInfo();
        return new SqlInfo().setTableName(sqlInfo.getTableName())
                .setOrderBy(sqlInfo.getOrderBy());
    }

    @Data
    @Accessors(chain = true)
    public static class LayoutInfo {

        @Comment("编辑布局")
        private String editLayout;

        @Comment("分页大小")
        private Integer pageSize;

        @Comment("可选分页数")
        private List<Integer> pageSizes;

    }

    @Data
    @Accessors(chain = true)
    public static class SqlInfo {

        @Comment("表名")
        private String tableName;

        @Comment("排序表达式")
        private String orderBy;

    }
}
