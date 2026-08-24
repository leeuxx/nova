package xyz.nova.service.impl;

import lombok.AllArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.support.ConfigurableConversionService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.stream.Collectors;

import xyz.nova.annotation.sub.nova.TreeType;
import xyz.nova.annotation.sub.nova.field.Edit;
import xyz.nova.annotation.sub.nova.field.edit.ButtonHandle;
import xyz.nova.annotation.sub.nova.field.view.PopHandler;
import xyz.nova.annotation.sub.nova.row.OperationHandler;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.dto.*;
import xyz.nova.dto.page.PageBean;
import xyz.nova.entity.data.*;
import xyz.nova.error.NovaException;
import xyz.nova.service.NovaTableService;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.*;

import java.util.*;

@Slf4j
@Service
@AllArgsConstructor
public class NovaTableServiceImpl implements NovaTableService {

    private ConversionService conversionService;

    @Override
    public NovaTableBuild.Vo build(NovaTableBuild novaTableBuild) {
        NovaTableBuild.Vo vo = new NovaTableBuild.Vo();
        // 获取novaId属性名称
        String novaIdFieldName = NovaFieldUtils.getNovaIdFieldName(novaTableBuild.getNovaName());
        if (novaIdFieldName == null) {
            throw new NovaException("Nova读取异常");
        }
        // 获取双表视图表列压缩系数
        vo.setNovaIdFieldName(novaIdFieldName);
        Double dualShrink = NovaUtils.getDualShrink(novaTableBuild.getNovaName());
        vo.setDualShrink(dualShrink);
        // 获取树结构信息
        TreeType treeType = NovaUtils.tree(novaTableBuild.getNovaName());
        NovaTableBuild.Vo.TreeInfo treeInfo = new NovaTableBuild.Vo.TreeInfo()
                .setValue(Objects.requireNonNull(treeType).value())
                .setSearchField(treeType.label())
                .setCascade(treeType.cascade())
                .setLevel(treeType.level());
        vo.setTree(treeInfo);
        // 获取搜索条件
        List<NovaTableBuild.Vo.Search> searchList = new ArrayList<>();
        if (!treeInfo.getValue()) {
            List<NovaFieldUtils.SearchInfo> searchs = NovaFieldUtils.getSearch(novaTableBuild.getNovaName());
            for (NovaFieldUtils.SearchInfo search : searchs) {
                NovaTableBuild.Vo.Search searchVo = new NovaTableBuild.Vo.Search()
                        .setField(search.getField())
                        .setTitle(search.getTitle())
                        .setType(search.getType().name())
                        .setVague(search.getVague());
                if (search.getTapSearch() != null) {
                    searchVo.setTapSearch(new NovaTableBuild.Vo.Search.TapSearch()
                            .setShowAll(search.getTapSearch().showAll())
                    );
                }
                searchList.add(searchVo);
            }
            vo.setSearch(searchList);
        }
        // 获取表头列
        List<NovaTableBuild.Vo.TableColumn> tableColumnList = new ArrayList<>();
        List<NovaFieldUtils.TableColumnInfo> tableColumns = NovaFieldUtils.getTableColumn(novaTableBuild.getNovaName());
        for (NovaFieldUtils.TableColumnInfo tableColumn : tableColumns) {
            tableColumnList.add(new NovaTableBuild.Vo.TableColumn()
                    .setField(tableColumn.getField())
                    .setTitle(tableColumn.getTitle())
                    .setDesc(tableColumn.getDesc())
                    .setWidth(tableColumn.getWidth())
                    .setSortable(tableColumn.getSortable())
                    .setType(tableColumn.getType().name())
                    .setDefaultValue(tableColumn.getDefaultValue())
                    .setRefNovaName(tableColumn.getRefNovaName())
            );
        }
        vo.setTableColumns(tableColumnList);
        // 获取功能布局
        NovaUtils.LayoutInfo layoutInfo = NovaUtils.getLayout(novaTableBuild.getNovaName());
        vo.setLayout(new NovaTableBuild.Vo.Layout()
                .setEditLayout(layoutInfo.getEditLayout().name())
                .setPageSize(layoutInfo.getPageSize())
                .setPageSizes(layoutInfo.getPageSizes())
        );
        // 获取编辑信息
        List<NovaTableBuild.Vo.Edit> editList = new ArrayList<>();
        List<NovaFieldUtils.EditInfo> editInfos = NovaFieldUtils.getEdit(novaTableBuild.getNovaName());
        for (NovaFieldUtils.EditInfo editInfo : editInfos) {
            NovaTableBuild.Vo.Edit edit = new NovaTableBuild.Vo.Edit()
                    .setTapType(editInfo.getTapType())
                    .setTapTitle(editInfo.getTapTitle())
                    .setTapNovaName(editInfo.getTapNovaName())
                    .setTapShow(editInfo.getTapShow())
                    .setTapShowByExpr(editInfo.getTapShowByExpr());
            if (edit.getTapType().equals("thisForm")) {
                List<NovaFieldUtils.EditInfo.ThisForm> thisForms = editInfo.getThisForms();
                List<NovaTableBuild.Vo.Edit.ThisForm> thisFormList = new ArrayList<>();
                for (NovaFieldUtils.EditInfo.ThisForm thisForm : thisForms) {
                    NovaFieldUtils.EditInfo.ThisForm.ReadonlyInfo ro = thisForm.getReadonly();
                    thisFormList.add(new NovaTableBuild.Vo.Edit.ThisForm()
                            .setField(thisForm.getField())
                            .setTitle(thisForm.getTitle())
                            .setDesc(thisForm.getDesc())
                            .setType(thisForm.getType().name())
                            .setNotNull(thisForm.getNotNull())
                            .setReadonly(new NovaTableBuild.Vo.Edit.ThisForm.ReadonlyInfo()
                                    .setAdd(ro.getAdd())
                                    .setEdit(ro.getEdit()))
                            .setShowByExpr(thisForm.getShowBy().value())
                            .setGroup(thisForm.getGroup())
                            .setDefaultValue(thisForm.getDefaultValue())
                    );
                }
                edit.setThisForms(thisFormList);
            }
            editList.add(edit);
        }
        vo.setEdit(editList);
        // 获取选择组件信息
        Map<String, NovaTableBuild.Vo.Choice> choiceMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.ChoiceInfo> choices = NovaFieldUtils.getChoice(novaTableBuild.getNovaName());
        choices.forEach((field, choiceInfo) -> {
            List<NovaTableBuild.Vo.Choice.Value> buildValues = new ArrayList<>();
            List<NovaFieldUtils.ChoiceInfo.ValueInfo> fieldValues = choiceInfo.getValues();
            for (NovaFieldUtils.ChoiceInfo.ValueInfo fieldValue : fieldValues) {
                NovaTableBuild.Vo.Choice.Value value = new NovaTableBuild.Vo.Choice.Value()
                        .setValue(fieldValue.getValue())
                        .setLabel(fieldValue.getLabel())
                        .setColor(fieldValue.getColor())
                        .setRefValue(fieldValue.getRefValue());
                buildValues.add(value);
            }
            choiceMap.put(field, new NovaTableBuild.Vo.Choice()
                    .setSelectType(choiceInfo.getSelectType().name())
                    .setShowType(choiceInfo.getShowType().name())
                    .setRefChoice(choiceInfo.getRefChoice())
                    .setValues(buildValues)
            );
        });
        vo.setChoice(choiceMap);
        // 获取标签组件信息
        Map<String, NovaTableBuild.Vo.Tag> tagMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.TagInfo> tags = NovaFieldUtils.getTag(novaTableBuild.getNovaName());
        tags.forEach((field, tagInfo) -> {
            NovaTableBuild.Vo.Tag tag = new NovaTableBuild.Vo.Tag()
                    .setAllowExtension(tagInfo.getAllowExtension())
                    .setMaxTagCount(tagInfo.getMaxTagCount())
                    .setTags(tagInfo.getTags());
            tagMap.put(field, tag);
        });
        vo.setTag(tagMap);
        // 获取日期时间组件信息
        Map<String, NovaTableBuild.Vo.Date> dateMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.DateInfo> dates = NovaFieldUtils.getDate(novaTableBuild.getNovaName());
        dates.forEach((field, dateInfo) -> {
            NovaTableBuild.Vo.Date date = new NovaTableBuild.Vo.Date()
                    .setType(dateInfo.getType().name())
                    .setPickerMode(dateInfo.getPickerMode().name());
            dateMap.put(field, date);
        });
        vo.setDate(dateMap);
        // 获取数字组件信息
        Map<String, NovaTableBuild.Vo.Number> numberMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.NumberInfo> numbers = NovaFieldUtils.getNumber(novaTableBuild.getNovaName());
        numbers.forEach((field, numberInfo) -> {
            NovaTableBuild.Vo.Number number = new NovaTableBuild.Vo.Number()
                    .setType(numberInfo.getType().name())
                    .setMax(numberInfo.getMax())
                    .setMin(numberInfo.getMin())
                    .setDecimal(numberInfo.getDecimal())
                    .setRoll(numberInfo.getRoll());
            numberMap.put(field, number);
        });
        vo.setNumber(numberMap);
        // 获取布尔值组件信息
        Map<String, NovaTableBuild.Vo.BooleanInfo> booleanMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.BooleanInfo> booleanInfos = NovaFieldUtils.getBoolean(novaTableBuild.getNovaName());
        booleanInfos.forEach((field, booleanInfo) -> {
            NovaTableBuild.Vo.BooleanInfo booleanObj = new NovaTableBuild.Vo.BooleanInfo()
                    .setType(booleanInfo.getType().name())
                    .setTableType(booleanInfo.getTableType().name());
            booleanMap.put(field, booleanObj);
        });
        vo.setBooleanInfo(booleanMap);
        // 获取文件上传组件信息
        Map<String, NovaTableBuild.Vo.AttachmentType> attachmentMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.AttachmentTypeInfo> attachments = NovaFieldUtils.getAttachment(novaTableBuild.getNovaName());
        attachments.forEach((field, attachmentInfo) -> {
            NovaTableBuild.Vo.AttachmentType attachment = new NovaTableBuild.Vo.AttachmentType()
                    .setType(attachmentInfo.getType().name())
                    .setTableShowType(attachmentInfo.getTableShowType().name())
                    .setMaxLimit(attachmentInfo.getMaxLimit())
                    .setMinSize(attachmentInfo.getMinSize())
                    .setMaxSize(attachmentInfo.getMaxSize())
                    .setFileTypes(attachmentInfo.getFileTypes());
            attachmentMap.put(field, attachment);
        });
        vo.setAttachment(attachmentMap);
        // 获取对象引用组件信息
        Map<String, NovaTableBuild.Vo.ReferenceType> referenceMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.ReferenceTypeInfo> references = NovaFieldUtils.getReference(novaTableBuild.getNovaName());
        references.forEach((field, referenceInfo) -> {
            NovaTableBuild.Vo.ReferenceType reference = new NovaTableBuild.Vo.ReferenceType()
                    .setReferenceName(referenceInfo.getReferenceClass().getSimpleName())
                    .setReferenceField(referenceInfo.getRef())
                    .setStorageField(referenceInfo.getBy())
                    .setDisplayField(referenceInfo.getByName())
                    .setReferenceTransmitField(referenceInfo.getContext())
                    .setIsThisObj(referenceInfo.getIsThisObj());
            referenceMap.put(field, reference);
        });
        vo.setReference(referenceMap);
        // 获取附属对象/集合组件信息
        Map<String, NovaTableBuild.Vo.AppendageType> appendageMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.AppendageTypeInfo> appendages = NovaFieldUtils.getAppendage(novaTableBuild.getNovaName());
        appendages.forEach((field, appendageInfo) -> {
            String simpleName = appendageInfo.getReferenceClass().getSimpleName();
            String appendageNovaIdFieldName = NovaFieldUtils.getNovaIdFieldName(simpleName);
            NovaTableBuild.Vo.AppendageType appendage = new NovaTableBuild.Vo.AppendageType()
                    .setNovaIdFieldName(appendageNovaIdFieldName)
                    .setReferenceName(simpleName)
                    .setReferenceField(appendageInfo.getRef())
                    .setRefReference(appendageInfo.getRefReference())
                    .setStorageField(appendageInfo.getBy())
                    .setDisplayField(appendageInfo.getRefName())
                    .setDualTable(appendageInfo.getDualTable())
                    .setDualTableTitle(appendageInfo.getDualTableTitle());
            appendageMap.put(field, appendage);
        });
        vo.setAppendage(appendageMap);
        // 获取集合引用组件信息
        Map<String, NovaTableBuild.Vo.Link> linkMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.LinkInfo> links = NovaFieldUtils.getLink(novaTableBuild.getNovaName());
        links.forEach((field, linkInfo) -> {
            NovaFieldUtils.LinkInfo.Info selectInfo = linkInfo.getSelectInfo();
            NovaFieldUtils.LinkInfo.Info operateInfo = linkInfo.getOperateInfo();
            NovaTableBuild.Vo.Link link = new NovaTableBuild.Vo.Link()
                    .setReferenceName(linkInfo.getReferenceClass().getSimpleName())
                    .setReferenceTransmitField(linkInfo.getContext())
                    .setDualTable(linkInfo.getDualTable())
                    .setDualTableTitle(linkInfo.getDualTableTitle())
                    .setOperateInfo(new NovaTableBuild.Vo.Link.Info()
                            .setReferenceName(operateInfo.getReferenceClass().getSimpleName())
                            .setReferenceField(operateInfo.getRef())
                            .setStorageField(operateInfo.getBy())
                            .setDisplayField(operateInfo.getByName())
                    )
                    .setSelectInfo(new NovaTableBuild.Vo.Link.Info()
                            .setReferenceName(selectInfo.getReferenceClass().getSimpleName())
                            .setReferenceField(selectInfo.getRef())
                            .setStorageField(selectInfo.getBy())
                            .setDisplayField(selectInfo.getByName())
                    );
            linkMap.put(field, link);
        });
        vo.setLink(linkMap);
        // 获取集合引用目标组件信息
        NovaTableBuild.Vo.LinkTarget linkTarget = new NovaTableBuild.Vo.LinkTarget();
        NovaFieldUtils.LinkTargetInfo linkTargetInfo = NovaFieldUtils.getLinkTarget(novaTableBuild.getNovaName());
        linkTarget.setThisReferenceName(linkTargetInfo.getThisReferenceClass() != null ? linkTargetInfo.getThisReferenceClass().getSimpleName() : null)
                .setThisFieldName(linkTargetInfo.getThisFieldName())
                .setThisReferenceField(linkTargetInfo.getThisReferenceField())
                .setThisStorageField(linkTargetInfo.getThisStorageField())
                .setLinkReferenceName(linkTargetInfo.getLinkReferenceClass() != null ? linkTargetInfo.getLinkReferenceClass().getSimpleName() : null)
                .setLinkFieldName(linkTargetInfo.getLinkFieldName())
                .setLinkReferenceField(linkTargetInfo.getLinkReferenceField())
                .setLinkStorageField(linkTargetInfo.getLinkStorageField())
                .setLinkTree(linkTargetInfo.getLinkTree());
        vo.setLinkTarget(linkTarget);
        // 获取自定义按钮信息
        List<RowOperation> rowOperations = NovaUtils.getRowOperation(novaTableBuild.getNovaName());
        List<NovaTableBuild.Vo.RowOperationInfo> rowOperationInfos = new ArrayList<>();
        for (RowOperation rowOperation : rowOperations) {
            NovaTableBuild.Vo.RowOperationInfo rowOperationInfo = new NovaTableBuild.Vo.RowOperationInfo()
                    .setTitle(rowOperation.title())
                    .setTip("".equals(rowOperation.tip()) ? rowOperation.title() : rowOperation.tip())
                    .setCallHint(rowOperation.callHint())
                    .setColor(rowOperation.color())
                    .setIcon(rowOperation.icon())
                    .setMode(rowOperation.mode().name())
                    .setType(rowOperation.type().name())
                    .setIfExpr(rowOperation.ifExpr())
                    .setGroup(rowOperation.group())
                    .setNovaClassName(rowOperation.novaClass().getSimpleName().equals("void") ? null : rowOperation.novaClass().getSimpleName())
                    .setOperationParam(rowOperation.param());
            if (rowOperation.type() == RowOperation.Type.NOVA) {
                rowOperationInfo.setOperationHandler(rowOperation.operationHandler().getName());
            }
            if (rowOperation.type() == RowOperation.Type.TPL) {
                RowOperation.Tpl tpl = rowOperation.tpl();
                RowOperation.Tpl.OpenWay openWay = tpl.openWay();
                String width = tpl.width().isEmpty()
                        ? (openWay == RowOperation.Tpl.OpenWay.MODAL ? "80%" : "40%")
                        : tpl.width();
                String height = tpl.height().isEmpty()
                        ? (openWay == RowOperation.Tpl.OpenWay.MODAL ? "80%" : "40%")
                        : tpl.height();
                rowOperationInfo.setTpl(new NovaTableBuild.Vo.RowOperationInfo.TplInfo()
                        .setPath(tpl.path())
                        .setWidth(width)
                        .setHeight(height)
                        .setOpenWay(tpl.openWay().name())
                        .setDrawerPlacement(tpl.drawerPlacement().name())
                );
            }
            rowOperationInfos.add(rowOperationInfo);
        }
        vo.setRowOperations(rowOperationInfos);
        // 获取数据钻取信息
        List<NovaUtils.DrillInfo> drills = NovaUtils.getDrill(novaTableBuild.getNovaName());
        List<NovaTableBuild.Vo.Drill> drillInfos = new ArrayList<>();
        for (NovaUtils.DrillInfo drillInfo : drills) {
            NovaTableBuild.Vo.Drill drillInfoObj = new NovaTableBuild.Vo.Drill()
                    .setDualTableTitle(drillInfo.getDualTableTitle())
                    .setLinkNovaName(drillInfo.getLinkNova().getSimpleName())
                    .setColumn(drillInfo.getColumn())
                    .setJoinColumn(drillInfo.getJoinColumn());
            drillInfos.add(drillInfoObj);
        }
        vo.setDrills(drillInfos);
        // 获取按钮参数信息
        Map<String, NovaFieldUtils.ButtonInfo> buttonInfos = NovaFieldUtils.getButton(novaTableBuild.getNovaName());
        Map<String, NovaTableBuild.Vo.Button> buttons = new LinkedHashMap<>();
        buttonInfos.forEach((field, buttonInfo) -> {
            NovaTableBuild.Vo.Button button = new NovaTableBuild.Vo.Button()
                    .setId(buttonInfo.getId())
                    .setColor(buttonInfo.getColor())
                    .setParam(buttonInfo.getParam())
                    .setTransmitParams(buttonInfo.getTransmitParams())
                    .setHandleName(buttonInfo.getHandleClass() != null ? buttonInfo.getHandleClass().getName() : null)
                    .setHandleJs(buttonInfo.getHandleJs());
            buttons.put(field, button);
        });
        vo.setButtons(buttons);
        // 获取弹窗信息
        Map<String, NovaFieldUtils.PopInfo> popInfos = NovaFieldUtils.getPop(novaTableBuild.getNovaName());
        Map<String, NovaTableBuild.Vo.Pop> pops = new LinkedHashMap<>();
        popInfos.forEach((field, popInfo) -> {
            NovaTableBuild.Vo.Pop pop = new NovaTableBuild.Vo.Pop()
                    .setTitle(popInfo.getTitle())
                    .setParam(popInfo.getParam())
                    .setHandleName(popInfo.getHandleClass() != null ? popInfo.getHandleClass().getName() : null);
            pops.put(field, pop);
        });
        vo.setPops(pops);
        // 获取表格行系统按钮隐藏控制信息
        NovaFieldUtils.SysBtnHideInfo sysBtnShowInfo = NovaFieldUtils.getSysBtnShow(novaTableBuild.getNovaName());
        NovaTableBuild.Vo.SysBtnHide sysBtnHide = new NovaTableBuild.Vo.SysBtnHide();
        if (sysBtnShowInfo.getEdit() != null) {
            sysBtnHide.setEdit(sysBtnShowInfo.getEdit().value());
        }
        if (sysBtnShowInfo.getDelete() != null) {
            sysBtnHide.setDelete(sysBtnShowInfo.getDelete().value());
        }
        if (sysBtnShowInfo.getRowSelect() != null) {
            sysBtnHide.setRowSelect(sysBtnShowInfo.getRowSelect().value());
        }
        vo.setSysBtnHide(sysBtnHide);
        return vo;
    }

    @Override
    public PageBean<Map<String, Object>> data(NovaTableData novaTableData) {
        String novaName = novaTableData.getNovaName();
        PageBean<Map<String, Object>> pageBean = novaTableData.getPageBean();
        List<OrderItemBean> orders = pageBean.getOrders();
        // 搜索条件（conditions 值已为 JSON 数组字符串，直接透传给 mapToSearchObj）
        Map<String, String> requestConditions = novaTableData.getConditions();
        // 排序
        List<OrderItemBean> requestOrders = new ArrayList<>();
        if (orders != null && !orders.isEmpty()) {
            orders.forEach(o -> requestOrders.add(
                    new OrderItemBean().setColumn(MixUtils.camelToSnake(o.getColumn())).setAsc(o.isAsc())
            ));
        }
        // 构造请求
        Fetch queryRequest = new Fetch()
                .setCurrent(pageBean.getCurrent())
                .setSize(pageBean.getSize())
                .setCondition(DataProxyUtils.mapToSearchObj(novaName, requestConditions))
                .setOrders(requestOrders)
                .setNovaName(novaTableData.getSourceNovaName())
                .setContext(novaTableData.getSourceFields());
        // 调用代理，获取实体列表
        DataProxy<?, ?> dataProxy = DataProxyUtils.getDataProxy(novaName);
        Fetch.Vo<?> fetch = dataProxy.fetch(queryRequest);
        List<?> records = fetch.getRecords();
        // 转换Map
        List<Map<String, Object>> maps = new ArrayList<>();
        records.forEach(record -> maps.add(DataProxyUtils.toMapWithTimestamp(record)));
        // 分页返回结果信息
        pageBean.setTotal(fetch.getTotal()).setRecords(maps);
        return pageBean;
    }

    @Override
    public Map<String, Object> details(NovaTableDetails novaTableDetails) {
        String novaName = novaTableDetails.getNovaName();
        String storageFieldValue = novaTableDetails.getStorageFieldValue();
        DataProxy<?, ?> dataProxy = DataProxyUtils.getDataProxy(novaName);
        return DataProxyUtils.toMapWithTimestamp(dataProxy.details(new Details()
                .setNovaName(novaName)
                .setValue(storageFieldValue)
        ));
    }

    @Override
    public PageBean<NovaTablePromptSearch.Vo> promptSearch(NovaTablePromptSearch novaTablePromptSearch) {
        PageBean<NovaTablePromptSearch.Vo> pageBean = novaTablePromptSearch.getPageBean();
        PromptSearch.Vo promptSearchVo = DataProxyUtils.getDataProxy(novaTablePromptSearch.getNovaName()).promptSearch(new PromptSearch()
                .setCurrent(pageBean.getCurrent())
                .setSize(pageBean.getSize())
                .setNovaName(novaTablePromptSearch.getNovaName())
                .setPrompt(novaTablePromptSearch.getPrompt())
                .setContext(novaTablePromptSearch.getSourceFields())
        );

        if (promptSearchVo == null) {
            return pageBean;
        }
        List<PromptSearch.Vo.Record> records = promptSearchVo.getRecords();
        List<NovaTablePromptSearch.Vo> vos = new ArrayList<>();
        for (PromptSearch.Vo.Record record : records) {
            NovaTablePromptSearch.Vo vo = new NovaTablePromptSearch.Vo()
                    .setStorageField(record.getId())
                    .setDisplayField(record.getName());
            vos.add(vo);
        }
        pageBean.setTotal(promptSearchVo.getTotal()).setRecords(vos);
        return pageBean;
    }

    @Override
    public NovaTableAdd.Vo add(NovaTableAdd novaTableAdd) {
        String novaName = novaTableAdd.getNovaName();
        List<String> columns = new ArrayList<>();
        List<String> values = new ArrayList<>();
        for (NovaTableAdd.FormInfo formInfo : novaTableAdd.getFormInfo()) {
            if (Edit.Type.REFERENCE.name().equals(formInfo.getType())) {
                continue;
            }
            columns.add(MixUtils.camelToSnake(formInfo.getField()));
            String value = formInfo.getValue();
            values.add((value == null || value.isEmpty()) ? null : value);
        }
        Object model = DataProxyUtils.buildModel(novaName, columns, values);
        for (NovaTableAdd.FormInfo formInfo : novaTableAdd.getFormInfo()) {
            if (Edit.Type.REFERENCE.name().equals(formInfo.getType())) {
                DataProxyUtils.setReferenceField(novaName, model, formInfo.getField(), formInfo.getValue());
            }
        }
        Map<String, List<NovaTableAdd.FormInfo>> appendageFormInfo = novaTableAdd.getAppendageFormInfo();
        if (appendageFormInfo != null) {
            for (Map.Entry<String, List<NovaTableAdd.FormInfo>> entry : appendageFormInfo.entrySet()) {
                String appNovaName = entry.getKey();
                List<String> appCols = new ArrayList<>();
                List<String> appVals = new ArrayList<>();
                for (NovaTableAdd.FormInfo fi : entry.getValue()) {
                    if (Edit.Type.REFERENCE.name().equals(fi.getType())) {
                        continue;
                    }
                    appCols.add(MixUtils.camelToSnake(fi.getField()));
                    String v = fi.getValue();
                    appVals.add((v == null || v.isEmpty()) ? null : v);
                }
                Object appModel = DataProxyUtils.buildModel(appNovaName, appCols, appVals);
                for (NovaTableAdd.FormInfo fi : entry.getValue()) {
                    if (Edit.Type.REFERENCE.name().equals(fi.getType())) {
                        DataProxyUtils.setReferenceField(appNovaName, appModel, fi.getField(), fi.getValue());
                    }
                }
                DataProxyUtils.setAppendageField(novaName, model, appNovaName, appModel);
            }
        }
        //noinspection unchecked,rawtypes
        ((DataProxy) DataProxyUtils.getDataProxy(novaName)).add(model);
        return new NovaTableAdd.Vo();
    }

    @Override
    public NovaTableAdd.Vo addLinkTarget(NovaTableAdd novaTableAdd) {
        String novaName = novaTableAdd.getNovaName();
        List<NovaTableAdd.FormInfo> formInfo = novaTableAdd.getFormInfo();
        // 找到多选字段（JSON数组值）和单选字段
        String multiField = null;
        List<String> multiValues = null;
        for (NovaTableAdd.FormInfo fi : formInfo) {
            String val = fi.getValue();
            if (val != null && val.startsWith("[") && val.endsWith("]")) {
                multiField = fi.getField();
                multiValues = DataProxyUtils.parseJsonArray(val);
                break;
            }
        }
        // noinspection rawtypes
        DataProxy dataProxy = DataProxyUtils.getDataProxy(novaName);
        List<Object> models = new ArrayList<>();
        if (multiValues != null && !multiValues.isEmpty()) {
            for (String targetId : multiValues) {
                Object model = DataProxyUtils.buildModel(novaName, List.of(), List.of());
                for (NovaTableAdd.FormInfo fi : formInfo) {
                    String v = fi.getField().equals(multiField) ? targetId : fi.getValue();
                    DataProxyUtils.setLinkTargetField(novaName, model, fi.getField(), v);
                }
                models.add(model);
            }
        }
        dataProxy.add(models);
        return new NovaTableAdd.Vo();
    }

    @Override
    public NovaTableUpdate.Vo update(NovaTableUpdate novaTableUpdate) {
        String novaName = novaTableUpdate.getNovaName();
        List<String> columns = new ArrayList<>();
        List<String> values = new ArrayList<>();
        for (NovaTableUpdate.FormInfo formInfo : novaTableUpdate.getFormInfo()) {
            if (Edit.Type.REFERENCE.name().equals(formInfo.getType())) {
                continue;
            }
            columns.add(MixUtils.camelToSnake(formInfo.getField()));
            String value = formInfo.getValue();
            values.add((value == null || value.isEmpty()) ? null : value);
        }
        Object model = DataProxyUtils.buildModel(novaName, columns, values);
        for (NovaTableUpdate.FormInfo formInfo : novaTableUpdate.getFormInfo()) {
            if (Edit.Type.REFERENCE.name().equals(formInfo.getType())) {
                DataProxyUtils.setReferenceField(novaName, model, formInfo.getField(), formInfo.getValue());
            }
        }
        Map<String, List<NovaTableUpdate.FormInfo>> appendageFormInfo = novaTableUpdate.getAppendageFormInfo();
        if (appendageFormInfo != null) {
            for (Map.Entry<String, List<NovaTableUpdate.FormInfo>> entry : appendageFormInfo.entrySet()) {
                String appNovaName = entry.getKey();
                List<String> appCols = new ArrayList<>();
                List<String> appVals = new ArrayList<>();
                for (NovaTableUpdate.FormInfo fi : entry.getValue()) {
                    if (Edit.Type.REFERENCE.name().equals(fi.getType())) {
                        continue;
                    }
                    appCols.add(MixUtils.camelToSnake(fi.getField()));
                    String v = fi.getValue();
                    appVals.add((v == null || v.isEmpty()) ? null : v);
                }
                Object appModel = DataProxyUtils.buildModel(appNovaName, appCols, appVals);
                for (NovaTableUpdate.FormInfo fi : entry.getValue()) {
                    if (Edit.Type.REFERENCE.name().equals(fi.getType())) {
                        DataProxyUtils.setReferenceField(appNovaName, appModel, fi.getField(), fi.getValue());
                    }
                }
                DataProxyUtils.setAppendageField(novaName, model, appNovaName, appModel);
            }
        }
        //noinspection unchecked,rawtypes
        ((DataProxy) DataProxyUtils.getDataProxy(novaName)).update(model);
        return new NovaTableUpdate.Vo();
    }

    @Override
    public NovaTableDelete.Vo delete(NovaTableDelete novaTableDelete) {
        String novaName = novaTableDelete.getNovaName();
        String pkColumn = MixUtils.camelToSnake(novaTableDelete.getNovaIdFieldName());
        List<String> novaIdValues = novaTableDelete.getNovaIdValues();
        List<Object> models = new ArrayList<>(novaIdValues.size());
        for (String novaIdValue : novaIdValues) {
            models.add(DataProxyUtils.buildModel(novaName, List.of(pkColumn), List.of(novaIdValue)));
        }
        //noinspection unchecked,rawtypes
        ((DataProxy) DataProxyUtils.getDataProxy(novaName)).delete(models);
        return new NovaTableDelete.Vo();
    }

    @Override
    @SneakyThrows
    public Map<String, Map<String, Object>> rowOperationLoad(NovaTableRowOperationLoad req) {
        String novaName = req.getNovaName();
        Class<?> handlerClass = Class.forName(req.getOperationHandler());
        OperationHandler handler = (OperationHandler<?, ?>) SpringBeanUtils.getBean(handlerClass);
        List<String> novaIds = req.getNovaIds() != null ? req.getNovaIds() : List.of();
        Class<?> novaIdClass = NovaFieldUtils.getNovaIdClass(novaName);
        List<Object> convertedIds = novaIds.stream()
                .map(id -> conversionService.convert(id, novaIdClass))
                .collect(Collectors.toList());
        Object formValue = handler.novaFormValue(convertedIds, req.getOperationParam());
        if (formValue == null) {
            return Map.of();
        }
        // 将 POJO 转为 Map，REFERENCE 和 APPENDAGE 嵌套对象保留为子对象
        Map<String, Object> mainMap = DataProxyUtils.toMapWithTimestamp(formValue);
        // 拆分 APPENDAGE 字段到对应子表
        Map<String, NovaFieldUtils.AppendageTypeInfo> appendages = NovaFieldUtils.getAppendage(novaName);
        Map<String, Map<String, Object>> result = new LinkedHashMap<>();
        for (Map.Entry<String, NovaFieldUtils.AppendageTypeInfo> entry : appendages.entrySet()) {
            Object nestedObj = mainMap.remove(entry.getKey());
            if (nestedObj != null) {
                String appNovaName = entry.getValue().getReferenceClass().getSimpleName();
                result.put(appNovaName, DataProxyUtils.toMapWithTimestamp(nestedObj));
            }
        }
        result.put(novaName, mainMap);
        return result;
    }

    @Override
    @SneakyThrows
    public NovaTableRowOperationSubmit.Vo rowOperationSubmit(NovaTableRowOperationSubmit req) {
        String type = req.getType();
        if (type.equals(RowOperation.Type.NOVA.name())) {
            // 从表单数据构建 NovaForm 对象
            Object novaForm = null;
            String novaFormName = req.getNovaFromName();
            if (novaFormName != null && !novaFormName.isEmpty() && req.getFormInfo() != null) {
                List<String> formCols = new ArrayList<>();
                List<String> formVals = new ArrayList<>();
                for (NovaTableRowOperationSubmit.FormInfo fi : req.getFormInfo()) {
                    if (Edit.Type.REFERENCE.name().equals(fi.getType())) {
                        continue;
                    }
                    formCols.add(MixUtils.camelToSnake(fi.getField()));
                    formVals.add((fi.getValue() == null || fi.getValue().isEmpty()) ? null : fi.getValue());
                }
                novaForm = DataProxyUtils.buildModel(novaFormName, formCols, formVals);
                for (NovaTableRowOperationSubmit.FormInfo fi : req.getFormInfo()) {
                    if (Edit.Type.REFERENCE.name().equals(fi.getType())) {
                        DataProxyUtils.setReferenceField(novaFormName, novaForm, fi.getField(), fi.getValue());
                    }
                }
                // 处理附属表单
                Map<String, List<NovaTableRowOperationSubmit.FormInfo>> appendageFormInfo = req.getAppendageFormInfo();
                if (appendageFormInfo != null) {
                    for (Map.Entry<String, List<NovaTableRowOperationSubmit.FormInfo>> entry : appendageFormInfo.entrySet()) {
                        String appNovaName = entry.getKey();
                        List<String> appCols = new ArrayList<>();
                        List<String> appVals = new ArrayList<>();
                        for (NovaTableRowOperationSubmit.FormInfo fi : entry.getValue()) {
                            if (Edit.Type.REFERENCE.name().equals(fi.getType())) {
                                continue;
                            }
                            appCols.add(MixUtils.camelToSnake(fi.getField()));
                            appVals.add((fi.getValue() == null || fi.getValue().isEmpty()) ? null : fi.getValue());
                        }
                        Object appModel = DataProxyUtils.buildModel(appNovaName, appCols, appVals);
                        for (NovaTableRowOperationSubmit.FormInfo fi : entry.getValue()) {
                            if (Edit.Type.REFERENCE.name().equals(fi.getType())) {
                                DataProxyUtils.setReferenceField(appNovaName, appModel, fi.getField(), fi.getValue());
                            }
                        }
                        DataProxyUtils.setAppendageField(novaFormName, novaForm, appNovaName, appModel);
                    }
                }
            }
            // 调用 OperationHandler
            List<String> novaIds = req.getNovaIds();
            Class<?> operationHandlerClass = Class.forName(req.getOperationHandler());
            OperationHandler operationHandler = (OperationHandler<?, ?>) SpringBeanUtils.getBean(operationHandlerClass);
            Class<?> novaIdClass = NovaFieldUtils.getNovaIdClass(req.getNovaName());
            List<Object> convertedIds = novaIds.stream()
                    .map(id -> conversionService.convert(id, novaIdClass))
                    .collect(Collectors.toList());
            String jsExpression = operationHandler.exec(convertedIds, novaForm, req.getOperationParam());
            return new NovaTableRowOperationSubmit.Vo().setJsExpression(jsExpression);
        }
        return new NovaTableRowOperationSubmit.Vo();
    }

    @Override
    public NovaTableTree.Vo tree(NovaTableTree novaTableTree) {
        // 排序
        List<OrderItemBean> orders = novaTableTree.getOrders();
        List<OrderItemBean> requestOrders = new ArrayList<>();
        if (orders != null && !orders.isEmpty()) {
            orders.forEach(o -> requestOrders.add(
                    new OrderItemBean().setColumn(MixUtils.camelToSnake(o.getColumn())).setAsc(o.isAsc())
            ));
        }
        Tree.Vo<?> tree = ((DataProxy) DataProxyUtils.getDataProxy(novaTableTree.getNovaName())).tree(new Tree()
                .setNovaName(novaTableTree.getSourceNovaName())
                .setContext(novaTableTree.getSourceFields())
                .setOrders(requestOrders)
                .setOperateValue(novaTableTree.getOperateValue())
        );
        List<?> rootList = tree.getRootList();
        List<?> childrenList = tree.getChildrenList();
        // 转换Map
        List<Map<String, Object>> rootMaps = new ArrayList<>();
        rootList.forEach(record -> rootMaps.add(DataProxyUtils.toMapWithTimestamp(record)));
        List<Map<String, Object>> childrenMaps = new ArrayList<>();
        childrenList.forEach(record -> childrenMaps.add(DataProxyUtils.toMapWithTimestamp(record)));
        return new NovaTableTree.Vo()
                .setRootList(rootMaps)
                .setChildrenList(childrenMaps);
    }

    @Override
    public List treeDisplay(NovaTableTree novaTableTree) {
        // 排序
        List<OrderItemBean> orders = novaTableTree.getOrders();
        List<OrderItemBean> requestOrders = new ArrayList<>();
        if (orders != null && !orders.isEmpty()) {
            orders.forEach(o -> requestOrders.add(
                    new OrderItemBean().setColumn(MixUtils.camelToSnake(o.getColumn())).setAsc(o.isAsc())
            ));
        }
        return DataProxyUtils.getDataProxy(novaTableTree.getNovaName()).treeDisplay(new Tree()
                .setNovaName(novaTableTree.getSourceNovaName())
                .setContext(novaTableTree.getSourceFields())
                .setOrders(requestOrders)
                .setOperateValue(novaTableTree.getOperateValue())
        );
    }

    @Override
    @SneakyThrows
    public NovaTableButton.Vo buttonClick(NovaTableButton novaTableButton) {
        Class<?> handleClass = Class.forName(novaTableButton.getHandleName());
        ButtonHandle buttonHandle = (ButtonHandle) SpringBeanUtils.getBean(handleClass);
        ButtonHandle.Vo vo = buttonHandle.buttonHandle(novaTableButton.getParam(), novaTableButton.getTransmitParams());
        if (vo == null) {
            vo = new ButtonHandle.Vo();
        }
        boolean status = vo.getStatus() != null && vo.getStatus();
        String message = vo.getMessage();
        if (message == null || message.isEmpty()) {
            message = status ? "请求成功" : "请求失败";
        }
        return new NovaTableButton.Vo()
                .setStatus(status)
                .setMessage(message);
    }

    @Override
    @SneakyThrows
    public List<NovaTablePop.Vo> pop(NovaTablePop novaTablePop) {
        Class<?> handleClass = Class.forName(novaTablePop.getHandleName());
        PopHandler popHandler = (PopHandler) SpringBeanUtils.getBean(handleClass);
        List<PopHandler.PopModel> popModels = popHandler.getPopModel(novaTablePop.getParam(), novaTablePop.getValue());
        List<NovaTablePop.Vo> vos = new ArrayList<>();
        popModels.forEach(popModel -> {
            NovaTablePop.Vo vo = new NovaTablePop.Vo()
                    .setType(popModel.getType().name())
                    .setName(popModel.getName())
                    .setValue(popModel.getValue());
            vos.add(vo);
        });
        return vos;
    }

}
