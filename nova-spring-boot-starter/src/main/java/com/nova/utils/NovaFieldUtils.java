package com.nova.utils;

import com.nova.annotation.Comment;
import com.nova.annotation.NovaField;
import com.nova.annotation.sub.Edit;
import com.nova.annotation.sub.View;
import com.nova.annotation.sub.edit.ChoiceType;
import com.nova.annotation.sub.edit.EditType;
import com.nova.annotation.sub.edit.Search;
import com.nova.annotation.sub.edit.VL;
import com.nova.config.NovaApplication;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class NovaFieldUtils {

    /**
     * 获取搜索条件信息
     *
     * @param className 类名
     * @return 搜索条件信息
     */
    public static List<SearchInfo> getSearch(String className) {
        List<SearchInfo> searchInfos = new ArrayList<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return searchInfos;
        }
        Map<String, NovaField> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaField) -> {
            Edit edit = novaField.edit();
            Search search = edit.search();
            if (search == null || !search.value()) {
                return;
            }
            SearchInfo.ChoiceInfo choiceInfo = new SearchInfo.ChoiceInfo();
            Map<String, String> choiceValues = new LinkedHashMap<>();
            if (edit.type() == EditType.CHOICE) {
                ChoiceType choiceType = edit.choiceType();
                VL[] vls = choiceType.vl();
                for (VL vl : vls) {
                    choiceValues.put(vl.value(), vl.label());
                }
                choiceInfo.setSelectType(choiceType.selectType().name())
                        .setValues(choiceValues);
            }
            SearchInfo searchInfo = new SearchInfo()
                    .setField(field)
                    .setTitle(edit.title())
                    .setType(edit.type().name())
                    .setVague(search.vague())
                    .setChoiceInfo(choiceInfo);
            searchInfos.add(searchInfo);
        });
        return searchInfos;
    }

    /**
     * 获取表头列信息
     *
     * @param className 类名
     * @return 表头列信息
     */
    public static List<TableColumnInfo> getTableColumn(String className) {
        List<TableColumnInfo> tableColumnInfos = new ArrayList<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return tableColumnInfos;
        }
        Map<String, NovaField> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaField) -> {
            View[] views = novaField.views();
            for (View view : views) {
                TableColumnInfo tableColumnInfo = new TableColumnInfo()
                        .setField(field)
                        .setTitle(view.title())
                        .setDesc(view.desc())
                        .setWidth(view.width())
                        .setSortable(view.sortable());
                tableColumnInfos.add(tableColumnInfo);
            }
        });
        return tableColumnInfos;
    }

    /**
     * 获取主键字段名
     *
     * @param className 类名
     * @return 主键字段名
     */
    public static String getPkFieldName(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return null;
        }
        return scanNova.getSqlInfo().getPkFieldName();
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
        return new SqlInfo().setColumnNames(sqlInfo.getColumnNames());
    }

    /**
     * 获取选择参数信息
     *
     * @param className 类名
     * @return 选择参数信息
     */
    public static Map<String, Map<String, String>> getChoiceValues(String className) {
        Map<String, Map<String, String>> choiceValues = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return choiceValues;
        }
        Map<String, NovaField> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaField) -> {
            Edit edit = novaField.edit();
            Map<String, String> map = new LinkedHashMap<>();
            if (edit.type() == EditType.CHOICE) {
                ChoiceType choiceType = edit.choiceType();
                VL[] vls = choiceType.vl();
                for (VL vl : vls) {
                    map.put(vl.value(), vl.label());
                }
                choiceValues.put(field, map);
            }
        });
        return choiceValues;
    }

    /**
     * 获取编辑信息
     *
     * @param className 类名
     * @return 编辑信息
     */
    public static List<EditInfo> getEdit(String className) {
        List<EditInfo> editInfos = new ArrayList<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return editInfos;
        }
        Map<String, NovaField> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaField) -> {
            Edit edit = novaField.edit();
            if (!edit.show()) {
                return;
            }
            EditInfo.ChoiceInfo choiceInfo = new EditInfo.ChoiceInfo();
            Map<String, String> choiceValues = new LinkedHashMap<>();
            if (edit.type() == EditType.CHOICE) {
                ChoiceType choiceType = edit.choiceType();
                VL[] vls = choiceType.vl();
                for (VL vl : vls) {
                    choiceValues.put(vl.value(), vl.label());
                }
                choiceInfo.setSelectType(choiceType.selectType().name())
                        .setValues(choiceValues);
            }
            EditInfo searchInfo = new EditInfo()
                    .setField(field)
                    .setTitle(edit.title())
                    .setType(edit.type().name())
                    .setNotNull(edit.notNull())
                    .setChoiceInfo(choiceInfo);
            editInfos.add(searchInfo);
        });
        return editInfos;
    }

    @Data
    @Accessors(chain = true)
    public static class SearchInfo {

        @Comment("属性名")
        private String field;

        @Comment("名称")
        private String title;

        @Comment("类型")
        private String type;

        @Comment("是否高级查询")
        private Boolean vague;

        @Comment("选择参数信息")
        private ChoiceInfo choiceInfo;

        @Data
        @Accessors(chain = true)
        public static class ChoiceInfo {

            @Comment("选择类型")
            private String selectType;

            @Comment("下拉参数")
            private Map<String, String> values;

        }
    }

    @Data
    @Accessors(chain = true)
    public static class TableColumnInfo {

        @Comment("属性名")
        private String field;

        @Comment("名称")
        private String title;

        @Comment("详细说明")
        private String desc;

        @Comment("列宽度（%）")
        private String width;

        @Comment("排序列")
        private Boolean sortable;

    }

    @Data
    @Accessors(chain = true)
    public static class SqlInfo {

        @Comment("字段名")
        private List<String> columnNames;
    }

    @Data
    @Accessors(chain = true)
    public static class ChoiceValue {

        @Comment("值")
        private String value;

        @Comment("标签")
        private String label;

    }

    @Data
    @Accessors(chain = true)
    public static class EditInfo {

        @Comment("属性名")
        private String field;

        @Comment("名称")
        private String title;

        @Comment("类型")
        private String type;

        @Comment("是否必填")
        private Boolean notNull;

        @Comment("选择参数信息")
        private ChoiceInfo choiceInfo;

        @Data
        @Accessors(chain = true)
        public static class ChoiceInfo {

            @Comment("选择类型")
            private String selectType;

            @Comment("下拉参数")
            private Map<String, String> values;

        }

    }
}
