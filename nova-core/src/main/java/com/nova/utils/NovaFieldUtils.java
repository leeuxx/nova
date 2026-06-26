package com.nova.utils;

import com.nova.annotation.NovaField;
import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.*;
import com.nova.config.NovaApplication;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.*;

public class NovaFieldUtils {

    /**
     * 获取数据标识字段名
     *
     * @param className 类名
     * @return 主键字段名
     */
    public static String getIdFieldName(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return null;
        }
        return scanNova.getIdFieldName();
    }

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
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            Search search = edit.search();
            if (search == null) {
                return;
            }
            if (!search.value()) {
                return;
            }
            Class<? extends SearchHandler>[] searchHandlerClasses = search.searchHandler();
            if (searchHandlerClasses.length > 0) {
                String[] searchHandlerParams = search.searchHandlerParams();
                for (Class<? extends SearchHandler> searchHandlerClass : searchHandlerClasses) {
                    SearchHandler searchHandler = SpringBeanUtils.getBean(searchHandlerClass);
                    boolean result = searchHandler.searchValue(searchHandlerParams);
                    if (!result) {
                        return;
                    }
                }
            }
            SearchInfo searchInfo = new SearchInfo()
                    .setField(field)
                    .setTitle(edit.title())
                    .setType(novaFieldInfo.getType())
                    .setVague(search.vague())
                    .setSort(search.sort());
            searchInfos.add(searchInfo);
        });
        searchInfos.sort(Comparator.comparingInt(SearchInfo::getSort));
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
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            View[] views = novaField.views();
            Edit edit = novaField.edit();
            Edit.Type type = edit.type();
            boolean isReference = type == Edit.Type.REFERENCE;
            for (View view : views) {
                if (view.show()) {
                    String fieldName = isReference ? field + "." + view.column() : field;
                    TableColumnInfo tableColumnInfo = new TableColumnInfo()
                            .setField(fieldName)
                            .setTitle(view.title())
                            .setDesc(view.desc())
                            .setWidth(view.width())
                            .setSortable(view.sortable())
                            .setType(novaFieldInfo.getType());
                    tableColumnInfos.add(tableColumnInfo);
                }
            }
        });
        return tableColumnInfos;
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
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (!edit.show()) {
                return;
            }
            Readonly readonly = edit.readonly();
            EditInfo searchInfo = new EditInfo()
                    .setField(field)
                    .setTitle(edit.title())
                    .setDesc(edit.desc())
                    .setType(novaFieldInfo.getType())
                    .setNotNull(edit.notNull())
                    .setReadonly(new EditInfo.ReadonlyInfo()
                            .setAdd(readonly.add())
                            .setEdit(readonly.edit())
                    )
                    .setShowBy(edit.showBy());
            editInfos.add(searchInfo);
        });
        return editInfos;
    }

    /**
     * 获取指定字段的选择类型（SINGLE / MULTI）
     *
     * @param className 类名
     * @param fieldName 字段名（驼峰）
     * @return SelectType，找不到返回 null
     */
    public static ChoiceType.SelectType getChoiceSelectType(String className, String fieldName) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return null;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        NovaApplication.ScanNova.NovaFieldInfo novaFieldInfo = novaFields.get(fieldName);
        NovaField novaField = novaFieldInfo.getNovaField();
        Edit edit = novaField.edit();
        return edit.choiceType().selectType();
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
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.CHOICE) {
                ChoiceType choiceType = edit.choiceType();
                ChoiceInfo choiceInfo = new ChoiceInfo()
                        .setSelectType(choiceType.selectType())
                        .setShowType(choiceType.showType());
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
                Class<? extends ChoiceFetchHandler>[] choiceFetchHandlerClass = choiceType.fetchHandler();
                if (choiceFetchHandlerClass.length > 0) {
                    String[] fetchHandlerParams = choiceType.fetchHandlerParams();
                    for (Class<? extends ChoiceFetchHandler> handlerClass : choiceFetchHandlerClass) {
                        ChoiceFetchHandler choiceFetchHandler = SpringBeanUtils.getBean(handlerClass);
                        List<ChoiceFetchHandler.VLModel> vlModelList = choiceFetchHandler.fetch(fetchHandlerParams);
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
     * 获取标签参数信息
     *
     * @param className 类名
     * @return 标签参数信息
     */
    public static Map<String, TagInfo> getTag(String className) {
        Map<String, TagInfo> tagInfos = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return tagInfos;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.TAG) {
                TagType tagType = edit.tagType();
                // 静态选择列表
                String[] staticTags = tagType.tags();
                List<String> tags = new ArrayList<>(Arrays.asList(staticTags));
                // 动态选择列表
                Class<? extends TagFetchHandler>[] tagFetchHandlerClass = tagType.fetchHandler();
                if (tagFetchHandlerClass.length > 0) {
                    String[] strings = tagType.fetchHandlerParams();
                    for (Class<? extends TagFetchHandler> handlerClass : tagFetchHandlerClass) {
                        TagFetchHandler tagFetchHandler = SpringBeanUtils.getBean(handlerClass);
                        List<String> fetchTags = tagFetchHandler.fetchTags(strings);
                        tags.addAll(fetchTags);
                    }
                }
                TagInfo tagInfo = new TagInfo()
                        .setAllowExtension(tagType.allowExtension())
                        .setMaxTagCount(tagType.maxTagCount())
                        .setTags(tags);
                tagInfos.put(field, tagInfo);
            }
        });
        return tagInfos;
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
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.DATE) {
                DateType dateType = edit.dateType();
                DateInfo dateInfo = new DateInfo()
                        .setType(dateType.type())
                        .setPickerMode(dateType.pickerMode());
                dateInfos.put(field, dateInfo);
            }
        });
        return dateInfos;
    }

    /**
     * 获取数值参数信息
     *
     * @param className 类名
     * @return 数值参数信息
     */
    public static Map<String, NumberInfo> getNumber(String className) {
        Map<String, NumberInfo> numberInfos = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return numberInfos;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.NUMBER) {
                NumberType numberType = edit.numberType();
                NumberInfo numberInfo = new NumberInfo()
                        .setType(numberType.type())
                        .setMax(numberType.max())
                        .setMin(numberType.min())
                        .setDecimal(numberType.decimal());
                numberInfos.put(field, numberInfo);
            }
        });
        return numberInfos;
    }

    /**
     * 获取布尔值参数信息
     *
     * @param className 类名
     * @return 布尔参数信息
     */
    public static Map<String, BooleanInfo> getBoolean(String className) {
        Map<String, BooleanInfo> booleanInfos = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return booleanInfos;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.BOOLEAN) {
                BooleanType booleanType = edit.booleanType();
                BooleanInfo booleanInfo = new BooleanInfo()
                        .setType(booleanType.type());
                booleanInfos.put(field, booleanInfo);
            }
        });
        return booleanInfos;
    }

    /**
     * 获取文件上传参数信息
     *
     * @param className 类名
     * @return 文件上传参数信息
     */
    public static Map<String, AttachmentTypeInfo> getAttachment(String className) {
        Map<String, AttachmentTypeInfo> attachmentTypeInfos = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return attachmentTypeInfos;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.ATTACHMENT) {
                AttachmentTypeInfo attachmentTypeInfo = new AttachmentTypeInfo()
                        .setType(edit.attachmentType().type())
                        .setMaxLimit(edit.attachmentType().maxLimit())
                        .setMinSize(edit.attachmentType().minSize())
                        .setMaxSize(edit.attachmentType().maxSize())
                        .setFileTypes(Arrays.asList(edit.attachmentType().fileTypes()));
                attachmentTypeInfos.put(field, attachmentTypeInfo);
            }
        });
        return attachmentTypeInfos;
    }

    /**
     * 获取关联参数信息
     *
     * @param className 类名
     * @return 关联参数信息
     */
    public static Map<String, ReferenceTypeInfo> getReference(String className) {
        Map<String, ReferenceTypeInfo> referenceTypeInfos = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return referenceTypeInfos;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.REFERENCE) {
                ReferenceType referenceType = edit.referenceType();
                ReferenceTypeInfo referenceTypeInfo = new ReferenceTypeInfo()
                        .setType(referenceType.type())
                        .setReferenceClass(novaFieldInfo.getFieldClass())
                        .setReferenceField(referenceType.referenceField())
                        .setReferenceTransmitField(Arrays.asList(referenceType.referenceTransmitField()))
                        .setStorageField(referenceType.storageField())
                        .setDisplayField(referenceType.displayField());
                referenceTypeInfos.put(field, referenceTypeInfo);
            }
        });
        return referenceTypeInfos;
    }

    @Data
    @Accessors(chain = true)
    public static class SearchInfo {

        @Comment("属性名")
        private String field;

        @Comment("名称")
        private String title;

        @Comment("类型")
        private Edit.Type type;

        @Comment("是否高级查询")
        private Boolean vague;

        @Comment("显示顺序,正序")
        private Integer sort;

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
        private Edit.Type type;

    }

    @Data
    @Accessors(chain = true)
    public static class EditInfo {

        @Comment("属性名")
        private String field;

        @Comment("名称")
        private String title;

        @Comment("详细说明")
        private String desc;

        @Comment("类型")
        private Edit.Type type;

        @Comment("是否必填")
        private Boolean notNull;

        @Comment("只读控制信息")
        private ReadonlyInfo readonly;

        @Comment("动态是否显示")
        private ShowBy showBy;

        @Data
        @Accessors(chain = true)
        public static class ReadonlyInfo {

            @Comment("新增只读")
            private Boolean add;

            @Comment("修改只读")
            private Boolean edit;

        }

    }

    @Data
    @Accessors(chain = true)
    public static class ChoiceInfo {

        @Comment("选择类型")
        private ChoiceType.SelectType selectType;

        @Comment("显示类型")
        private ChoiceType.ShowType showType;

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
    public static class TagInfo {

        @Comment("是否允许自定义标签")
        private Boolean allowExtension;

        @Comment("最大标签数")
        private Integer maxTagCount;

        @Comment("标签选择列表")
        private List<String> tags;

    }

    @Data
    @Accessors(chain = true)
    public static class DateInfo {

        @Comment("格式类型")
        private DateType.Type type;

        @Comment("选择模式")
        private DateType.PickerMode pickerMode;

    }

    @Data
    @Accessors(chain = true)
    public static class NumberInfo {

        @Comment("数值类型")
        private NumberType.Type type;

        @Comment("最大值")
        private Long max;

        @Comment("最小值")
        private Long min;

        @Comment("小数位数")
        private Integer decimal;

    }

    @Data
    @Accessors(chain = true)
    public static class BooleanInfo {

        @Comment("布尔值类型")
        private BooleanType.Type type;

    }

    @Data
    @Accessors(chain = true)
    public static class AttachmentTypeInfo {

        @Comment("附件类型")
        private AttachmentType.Type type;

        @Comment("最大上传数")
        private Integer maxLimit;

        @Comment("单个文件最小文件大小,kb")
        private Integer minSize;

        @Comment("单个文件最大文件大小,kb")
        private Integer maxSize;

        @Comment("允许上传的文件类型")
        private List<String> fileTypes;

    }

    @Data
    @Accessors(chain = true)
    public static class ReferenceTypeInfo {

        @Comment("关联类型")
        private ReferenceType.Type type;

        @Comment("关联类")
        private Class<?> referenceClass;

        @Comment("关联字段")
        private String referenceField;

        @Comment("关联引用透传属性")
        private List<String> referenceTransmitField;

        @Comment("存储列")
        private String storageField;

        @Comment("展示列")
        private String displayField;

    }
}
