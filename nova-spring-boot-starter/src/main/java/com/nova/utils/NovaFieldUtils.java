package com.nova.utils;

import com.nova.annotation.Comment;
import com.nova.annotation.NovaField;
import com.nova.annotation.sub.Edit;
import com.nova.annotation.sub.View;
import com.nova.annotation.sub.edit.*;
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
            SearchInfo searchInfo = new SearchInfo()
                    .setField(field)
                    .setTitle(edit.title())
                    .setType(edit.type().name())
                    .setVague(search.vague());
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
            Edit edit = novaField.edit();
            // 显示列
            for (View view : views) {
                TableColumnInfo tableColumnInfo = new TableColumnInfo()
                        .setField(field)
                        .setTitle(view.title())
                        .setDesc(view.desc())
                        .setWidth(view.width())
                        .setSortable(view.sortable())
                        .setType(edit.type().name());
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
            EditInfo searchInfo = new EditInfo()
                    .setField(field)
                    .setTitle(edit.title())
                    .setType(edit.type().name())
                    .setNotNull(edit.notNull());
            editInfos.add(searchInfo);
        });
        return editInfos;
    }

    /**
     * 获取选择参数信息
     *
     * @param className 类名
     * @return 选择参数信息
     */
    public static Map<String, ChoiceInfo> getChoice(String className) {
        Map<String, ChoiceInfo> choiceValues = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return choiceValues;
        }
        Map<String, NovaField> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaField) -> {
            Edit edit = novaField.edit();
            if (edit.type() == EditType.CHOICE) {
                ChoiceType choiceType = edit.choiceType();
                ChoiceInfo choiceInfo = new ChoiceInfo()
                        .setSelectType(choiceType.selectType().name());
                // 静态选择列表
                VL[] vls = choiceType.vl();
                List<ChoiceInfo.ValueInfo> values = new ArrayList<>();
                for (VL vl : vls) {
                    ChoiceInfo.ValueInfo valueInfo = new ChoiceInfo.ValueInfo()
                            .setValue(vl.value())
                            .setLabel(vl.label())
                            .setColor(vl.color());
                    values.add(valueInfo);
                }
                // 动态选择列表
                Class<? extends ChoiceType.ChoiceFetchHandler>[] choiceFetchHandlerClass = choiceType.fetchHandler();
                if (choiceFetchHandlerClass.length > 0) {
                    String[] fetchHandlerParams = choiceType.fetchHandlerParams();
                    for (Class<? extends ChoiceType.ChoiceFetchHandler> handlerClass : choiceFetchHandlerClass) {
                        ChoiceType.ChoiceFetchHandler choiceFetchHandler = SpringBeanUtils.getBean(handlerClass);
                        List<ChoiceType.ChoiceFetchHandler.VLModel> vlModelList = choiceFetchHandler.fetch(fetchHandlerParams);
                        vlModelList.forEach(vlModel -> {
                            ChoiceInfo.ValueInfo valueInfo = new ChoiceInfo.ValueInfo()
                                    .setValue(vlModel.getValue())
                                    .setLabel(vlModel.getLabel())
                                    .setColor(vlModel.getColor());
                            values.add(valueInfo);
                        });
                    }
                }
                choiceInfo.setValues(values);
                choiceValues.put(field, choiceInfo);
            }
        });
        return choiceValues;
    }

    /**
     * 获取日期时间参数信息
     *
     * @param className 类名
     * @return 日期参数信息
     */
    public static Map<String, DateInfo> getDate(String className) {
        Map<String, DateInfo> dateInfos = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return dateInfos;
        }
        Map<String, NovaField> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaField) -> {
            Edit edit = novaField.edit();
            if (edit.type() == EditType.DATE) {
                DateInfo dateInfo = new DateInfo();
                DateType dateType = edit.dateType();
                dateInfo.setType(dateType.type().name())
                        .setPickerMode(dateType.pickerMode().name());
                dateInfos.put(field, dateInfo);
            }
        });
        return dateInfos;
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

        @Comment("类型")
        private String type;

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

    }

    @Data
    @Accessors(chain = true)
    public static class ChoiceInfo {

        @Comment("选择类型")
        private String selectType;

        @Comment("选择值")
        private List<ValueInfo> values;

        @Data
        @Accessors(chain = true)
        public static class ValueInfo {

            @Comment("值")
            private String value;

            @Comment("标签")
            private String label;

            @Comment("颜色信息")
            private String color;
        }
    }

    @Data
    @Accessors(chain = true)
    public static class DateInfo {

        @Comment("格式类型")
        private String type;

        @Comment("选择模式")
        private String pickerMode;

    }
}
