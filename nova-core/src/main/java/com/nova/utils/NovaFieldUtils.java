package com.nova.utils;

import com.nova.annotation.NovaField;
import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;
import com.nova.annotation.sub.nova.field.edit.*;
import com.nova.annotation.sub.nova.row.ExprBool;
import com.nova.config.NovaApplication;
import lombok.Data;
import lombok.experimental.Accessors;

import java.lang.reflect.Field;
import java.util.*;

public class NovaFieldUtils {

    /**
     * 获取novaId属性名
     *
     * @param className 类名
     * @return novaId属性名
     */
    public static String getNovaIdFieldName(String className) {
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return null;
        }
        return scanNova.getNovaIdFieldName();
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
        final TapSearch[] tapSearch = {null};
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
            // 选择组件tap级搜索处理
            if (edit.type() == Edit.Type.CHOICE) {
                TapSearch tapSearchInfo = edit.choiceType().tapSearch();
                if (tapSearch[0] == null && tapSearchInfo.value()) {
                    tapSearch[0] = tapSearchInfo;
                    searchInfo.setTapSearch(tapSearchInfo);
                }
            }
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
            boolean isReference = (type == Edit.Type.REFERENCE || type == Edit.Type.APPENDAGE || type == Edit.Type.LINK_TARGET);
            boolean isAppendages = type == Edit.Type.APPENDAGES;
            boolean isLink = type == Edit.Type.LINK;
            for (View view : views) {
                if (!view.show() || isAppendages || isLink) {
                    continue;
                }
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
        List<EditInfo.ThisForm> thisForms = new ArrayList<>();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            // 自身详情tap
            if (edit.show()) {
                // 排除附属对象、附属集合、集合引用
                if (edit.type() != Edit.Type.APPENDAGE && edit.type() != Edit.Type.APPENDAGES && edit.type() != Edit.Type.LINK) {
                    Readonly readonly = edit.readonly();
                    EditInfo.ThisForm thisForm = new EditInfo.ThisForm()
                            .setField(field)
                            .setTitle(edit.title())
                            .setDesc(edit.desc())
                            .setType(novaFieldInfo.getType())
                            .setNotNull(edit.notNull())
                            .setReadonly(new EditInfo.ThisForm.ReadonlyInfo()
                                    .setAdd(readonly.add())
                                    .setEdit(readonly.edit())
                            )
                            .setShowBy(edit.showBy());
                    thisForms.add(thisForm);
                }
            }
            // 附属对象tap
            if (edit.type() == Edit.Type.APPENDAGE) {
                AppendageType appendageType = edit.appendageType();
                boolean tapShow = NovaUtils.exprBool(appendageType.tapShow(), appendageType.show());
                if (tapShow) {
                    Class<?> fieldClass = novaFieldInfo.getFieldClass();
                    EditInfo editInfo = new EditInfo()
                            .setTapType("appendageForm")
                            .setTapNovaName(fieldClass.getSimpleName())
                            .setTapTitle(edit.title())
                            .setTapShow(appendageType.tapShow())
                            .setTapShowByExpr(appendageType.tapShowBy().value())
                            .setTapSort(1);
                    editInfos.add(editInfo);
                }
            }
            // 附属集合tap
            if (edit.type() == Edit.Type.APPENDAGES) {
                AppendageType appendageType = edit.appendageType();
                boolean tapShow = NovaUtils.exprBool(appendageType.tapShow(), appendageType.show());
                if (tapShow) {
                    Class<?> fieldClass = novaFieldInfo.getFieldClass();
                    editInfos.add(new EditInfo()
                            .setTapType("appendagesTable")
                            .setTapNovaName(fieldClass.getSimpleName())
                            .setTapTitle(edit.title())
                            .setTapShow(appendageType.tapShow())
                            .setTapShowByExpr(appendageType.tapShowBy().value())
                            .setTapSort(2)
                    );
                }
            }
            // 集合引用tap
            if (edit.type() == Edit.Type.LINK) {
                LinkType linkType = edit.linkType();
                boolean tapShow = NovaUtils.exprBool(linkType.tapShow(), linkType.show());
                if (tapShow) {
                    Class<?> fieldClass = novaFieldInfo.getFieldClass();
                    editInfos.add(new EditInfo()
                            .setTapType("linkForm")
                            .setTapNovaName(fieldClass.getSimpleName())
                            .setTapTitle(edit.title())
                            .setTapShow(linkType.tapShow())
                            .setTapShowByExpr(linkType.tapShowBy().value())
                            .setTapSort(3)
                    );
                }
            }
            // 引用详情tap
            if (edit.type() == Edit.Type.REFERENCE) {
                ReferenceType referenceType = edit.referenceType();
                boolean tapShow = NovaUtils.exprBool(referenceType.tapShow(), referenceType.show());
                if (tapShow) {
                    Class<?> fieldClass = novaFieldInfo.getFieldClass();
                    editInfos.add(new EditInfo()
                            .setTapType("referenceForm")
                            .setTapNovaName(fieldClass.getSimpleName())
                            .setTapTitle(edit.title())
                            .setTapShow(referenceType.tapShow())
                            .setTapShowByExpr(referenceType.tapShowBy().value())
                            .setTapSort(4)
                    );
                }
            }
        });
        editInfos.add(new EditInfo()
                .setTapType("thisForm")
                .setTapNovaName(className)
                .setTapTitle("基本信息")
                .setThisForms(thisForms)
                .setTapShow(true)
                .setTapSort(0)
        );
        editInfos.sort(Comparator.comparingInt(EditInfo::getTapSort));
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
                        .setShowType(edit.attachmentType().showType())
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
     * 获取对象引用参数信息
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
                        .setReferenceClass(novaFieldInfo.getFieldClass())
                        .setReferenceField(referenceType.referenceField())
                        .setStorageField(referenceType.storageField())
                        .setDisplayField(referenceType.displayField())
                        .setReferenceTransmitField(Arrays.asList(referenceType.referenceTransmitField()))
                        .setIsThisObj(novaFieldInfo.getFieldClass().getSimpleName().equals(className));
                referenceTypeInfos.put(field, referenceTypeInfo);
            }
        });
        return referenceTypeInfos;
    }

    /**
     * 获取附属对象/集合参数信息
     *
     * @param className 类名
     * @return 附件参数信息
     */
    public static Map<String, AppendageTypeInfo> getAppendage(String className) {
        Map<String, AppendageTypeInfo> appendageTypeInfos = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return appendageTypeInfos;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.APPENDAGE || edit.type() == Edit.Type.APPENDAGES) {
                AppendageType appendageType = edit.appendageType();
                AppendageTypeInfo appendageTypeInfo = new AppendageTypeInfo()
                        .setReferenceClass(novaFieldInfo.getFieldClass())
                        .setReferenceField(appendageType.referenceField())
                        .setStorageField(appendageType.storageField())
                        .setDisplayField(appendageType.displayField())
                        .setDualTable(edit.type() == Edit.Type.APPENDAGES && NovaUtils.exprBool(appendageType.dualTable(), appendageType.show()))
                        .setDualTableTitle(edit.title());
                appendageTypeInfos.put(field, appendageTypeInfo);
            }
        });
        return appendageTypeInfos;
    }

    /**
     * 获取集合引用参数信息
     *
     * @param className 类名
     * @return 集合引用参数信息
     */
    public static Map<String, LinkInfo> getLink(String className) {
        Map<String, LinkInfo> linkInfos = new LinkedHashMap<>();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return linkInfos;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.LINK) {
                LinkType linkType = edit.linkType();
                LinkInfo linkInfo = new LinkInfo()
                        .setReferenceClass(novaFieldInfo.getFieldClass())
                        .setReferenceTransmitField(Arrays.asList(linkType.referenceTransmitField()))
                        .setDualTable(NovaUtils.exprBool(linkType.dualTable(), linkType.show()))
                        .setDualTableTitle(edit.title());
                linkInfos.put(field, linkInfo);
                // 获取中间类中的LINK_TARGET声明属性
                Class<?> fieldClass = novaFieldInfo.getFieldClass();
                Field[] fields = fieldClass.getDeclaredFields();
                for (Field field2 : fields) {
                    if (!field2.isAnnotationPresent(NovaField.class)) {
                        continue;
                    }
                    NovaField novaField2 = field2.getDeclaredAnnotation(NovaField.class);
                    if (novaField2.edit().type() != Edit.Type.LINK_TARGET) {
                        continue;
                    }
                    LinkTargetType linkTargetType = novaField2.edit().linkTargetType();
                    if (linkTargetType.type() == LinkTargetType.Type.OPERATE) {
                        linkInfo.setOperateInfo(new LinkInfo.Info()
                                .setReferenceClass(field2.getType())
                                .setReferenceField(linkTargetType.referenceField())
                                .setStorageField(linkTargetType.storageField())
                                .setDisplayField(linkTargetType.displayField())
                        );
                    }
                    if (linkTargetType.type() == LinkTargetType.Type.SELECT) {
                        linkInfo.setSelectInfo(new LinkInfo.Info()
                                .setReferenceClass(field2.getType())
                                .setReferenceField(linkTargetType.referenceField())
                                .setStorageField(linkTargetType.storageField())
                                .setDisplayField(linkTargetType.displayField())
                        );
                    }
                }
            }
        });
        return linkInfos;
    }

    /**
     * 获取集合引用目标参数信息
     *
     * @param className 类名
     * @return 集合引用目标参数信息
     */
    public static LinkTargetInfo getLinkTarget(String className) {
        LinkTargetInfo linkTargetInfo = new LinkTargetInfo();
        Map<String, NovaApplication.ScanNova> scanNovas = NovaApplication.getScanNovas();
        NovaApplication.ScanNova scanNova = scanNovas.get(className);
        if (scanNova == null) {
            return linkTargetInfo;
        }
        Map<String, NovaApplication.ScanNova.NovaFieldInfo> novaFields = scanNova.getNovaFields();
        novaFields.forEach((field, novaFieldInfo) -> {
            NovaField novaField = novaFieldInfo.getNovaField();
            Edit edit = novaField.edit();
            if (edit.type() == Edit.Type.LINK_TARGET) {
                LinkTargetType linkTargetType = edit.linkTargetType();
                if (linkTargetType.type() == LinkTargetType.Type.SELECT) {
                    linkTargetInfo.setLinkReferenceClass(novaFieldInfo.getFieldClass())
                            .setLinkFieldName(novaFieldInfo.getFieldName())
                            .setLinkReferenceField(linkTargetType.referenceField())
                            .setLinkStorageField(linkTargetType.storageField());
                    NovaApplication.ScanNova linkTargetScanNova = scanNovas.get(novaFieldInfo.getFieldClass().getSimpleName());
                    linkTargetInfo.setLinkTree(linkTargetScanNova.getNova().tree().value());
                } else {
                    linkTargetInfo.setThisReferenceClass(novaFieldInfo.getFieldClass())
                            .setThisFieldName(novaFieldInfo.getFieldName())
                            .setThisReferenceField(linkTargetType.referenceField())
                            .setThisStorageField(linkTargetType.storageField());
                }
            }
        });
        return linkTargetInfo;
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

        @Comment("下拉组件tap级搜索项")
        private TapSearch tapSearch;

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

        @Comment("tap类型 thisForm=自身tap referenceForm=引用tap appendageForm=附属对象tap appendagesTable=附属集合tap linkForm=集合引用tap")
        private String tapType;

        @Comment("tap名称")
        private String tapTitle;

        @Comment("tapNovaName")
        private String tapNovaName;

        @Comment("tap页显示")
        private Boolean tapShow;

        @Comment("tap页动态显示表达式")
        private String tapShowByExpr;

        @Comment("自身详情表单编辑信息")
        private List<ThisForm> thisForms;

        @Comment("tap排序")
        private Integer tapSort = 0;

        @Data
        @Accessors(chain = true)
        public static class ThisForm {

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

        @Comment("附件显示类型")
        private AttachmentType.ShowType showType;

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

        @Comment("关联类")
        private Class<?> referenceClass;

        @Comment("引用类值属性名，默认id")
        private String referenceField;

        @Comment("引用类显示属性名")
        private String storageField;

        @Comment("引用类显示属性名")
        private String displayField;

        @Comment("当前类获取引用类数据时，额外向引用类 DataProxy.fetch 传递的当前类表单上下文信息")
        private List<String> referenceTransmitField;

        @Comment("是否为当前nova本身对象（树渲染有用）")
        private Boolean isThisObj;

    }

    @Data
    @Accessors(chain = true)
    public static class AppendageTypeInfo {

        @Comment("关联类")
        private Class<?> referenceClass;

        @Comment("附属类存储当前类的关联属性名")
        private String referenceField;

        @Comment("当前类属性名")
        private String storageField;

        @Comment("附属类显示属性名")
        private String displayField;

        @Comment("是否支持双表视图")
        private Boolean dualTable;

        @Comment("双表视图标题")
        private String dualTableTitle;

    }

    @Data
    @Accessors(chain = true)
    public static class LinkInfo {

        @Comment("关联类")
        private Class<?> referenceClass;

        @Comment("中间类获取目标引用类数据时（弹窗选取），额外透传向引用类 DataProxy.fetch 传递的当前类表单上下文信息")
        private List<String> referenceTransmitField;

        @Comment("中间类操作引用类信息")
        private Info operateInfo;

        @Comment("中间类选取引用类信息")
        private Info selectInfo;

        @Comment("是否支持双表视图")
        private Boolean dualTable;

        @Comment("双表视图标题")
        private String dualTableTitle;

        @Data
        @Accessors(chain = true)
        public static class Info {

            @Comment("关联类")
            private Class<?> referenceClass;

            @Comment("中间类存储引用类关联属性名")
            private String referenceField;

            @Comment("引用类值属性名，既对应引用类的哪个属性")
            private String storageField;

            @Comment("引用类值显示属性名，替代 storageField 展示")
            private String displayField;
        }
    }

    @Data
    @Accessors(chain = true)
    public static class LinkTargetInfo {

        @Comment("当前关联类")
        private Class<?> thisReferenceClass;

        @Comment("当前关联类属性名")
        private String thisFieldName;

        @Comment("中间类存储当前引用类的关联属性名，例如 userId")
        private String thisReferenceField;

        @Comment("中间类存储当前引用类值属性名，默认id，即当前类的 thisReferenceField 对应当前引用类的哪个属性（通常为主键）")
        private String thisStorageField;

        @Comment("目标关联类")
        private Class<?> linkReferenceClass;

        @Comment("目标关联类属性名")
        private String linkFieldName;

        @Comment("中间类存储目标引用类的关联属性名，例如 ordersId")
        private String linkReferenceField;

        @Comment("中间类存储目标引用类值属性名，默认id，即当前类的 linkReferenceField 对应目标引用类的哪个属性（通常为主键）")
        private String linkStorageField;

        @Comment("目标关联类是否为树结构")
        private Boolean linkTree;

    }

}
