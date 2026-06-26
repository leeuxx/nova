package com.nova.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.nova.annotation.fun.*;
import com.nova.dto.*;
import com.nova.dto.page.PageBean;
import com.nova.service.NovaTableService;
import com.nova.utils.DataProxyUtils;
import com.nova.utils.MixUtils;
import com.nova.utils.NovaFieldUtils;
import com.nova.utils.NovaUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class NovaTableServiceImpl implements NovaTableService {

    @Override
    public NovaTableBuild.Vo build(NovaTableBuild novaTableBuild) {
        NovaTableBuild.Vo vo = new NovaTableBuild.Vo();
        // 获取数据标识属性名称
        String idFieldName = NovaFieldUtils.getIdFieldName(novaTableBuild.getNovaName());
        vo.setIdFieldName(idFieldName);
        // 获取搜索条件
        List<NovaTableBuild.Vo.Search> searchList = new ArrayList<>();
        List<NovaFieldUtils.SearchInfo> searchs = NovaFieldUtils.getSearch(novaTableBuild.getNovaName());
        for (NovaFieldUtils.SearchInfo search : searchs) {
            // 构造返回值
            searchList.add(new NovaTableBuild.Vo.Search()
                    .setField(search.getField())
                    .setTitle(search.getTitle())
                    .setType(search.getType().name())
                    .setVague(search.getVague())
            );
        }
        vo.setSearch(searchList);
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
            NovaFieldUtils.EditInfo.ReadonlyInfo ro = editInfo.getReadonly();
            editList.add(new NovaTableBuild.Vo.Edit()
                    .setField(editInfo.getField())
                    .setTitle(editInfo.getTitle())
                    .setDesc(editInfo.getDesc())
                    .setType(editInfo.getType().name())
                    .setNotNull(editInfo.getNotNull())
                    .setReadonly(new NovaTableBuild.Vo.Edit.ReadonlyInfo()
                            .setAdd(ro.getAdd())
                            .setEdit(ro.getEdit()))
                    .setShowByExpr(editInfo.getShowBy().value())
            );
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
                        .setColor(fieldValue.getColor());
                buildValues.add(value);
            }
            choiceMap.put(field, new NovaTableBuild.Vo.Choice()
                    .setSelectType(choiceInfo.getSelectType().name())
                    .setShowType(choiceInfo.getShowType().name())
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
                    .setDecimal(numberInfo.getDecimal());
            numberMap.put(field, number);
        });
        vo.setNumber(numberMap);
        // 获取布尔值组件信息
        Map<String, NovaTableBuild.Vo.BooleanInfo> booleanMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.BooleanInfo> booleanInfos = NovaFieldUtils.getBoolean(novaTableBuild.getNovaName());
        booleanInfos.forEach((field, booleanInfo) -> {
            NovaTableBuild.Vo.BooleanInfo booleanObj = new NovaTableBuild.Vo.BooleanInfo()
                    .setType(booleanInfo.getType().name());
            booleanMap.put(field, booleanObj);
        });
        vo.setBooleanInfo(booleanMap);
        // 获取文件上传组件信息
        Map<String, NovaTableBuild.Vo.AttachmentType> attachmentMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.AttachmentTypeInfo> attachments = NovaFieldUtils.getAttachment(novaTableBuild.getNovaName());
        attachments.forEach((field, attachmentInfo) -> {
            NovaTableBuild.Vo.AttachmentType attachment = new NovaTableBuild.Vo.AttachmentType()
                    .setType(attachmentInfo.getType().name())
                    .setMaxLimit(attachmentInfo.getMaxLimit())
                    .setMinSize(attachmentInfo.getMinSize())
                    .setMaxSize(attachmentInfo.getMaxSize())
                    .setFileTypes(attachmentInfo.getFileTypes());
            attachmentMap.put(field, attachment);
        });
        vo.setAttachment(attachmentMap);
        // 获取关联引用组件信息
        Map<String, NovaTableBuild.Vo.ReferenceType> referenceMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.ReferenceTypeInfo> references = NovaFieldUtils.getReference(novaTableBuild.getNovaName());
        references.forEach((field, referenceInfo) -> {
            NovaTableBuild.Vo.ReferenceType reference = new NovaTableBuild.Vo.ReferenceType()
                    .setType(referenceInfo.getType().name())
                    .setReferenceName(referenceInfo.getReferenceClass().getSimpleName())
                    .setReferenceField(referenceInfo.getReferenceField())
                    .setReferenceTransmitField(referenceInfo.getReferenceTransmitField())
                    .setStorageField(referenceInfo.getStorageField())
                    .setDisplayField(referenceInfo.getDisplayField());
            referenceMap.put(field, reference);
        });
        vo.setReference(referenceMap);
        return vo;
    }

    @Override
    public PageBean<Map<String, Object>> data(NovaTableData novaTableData) {
        String novaName = novaTableData.getNovaName();
        PageBean<Map<String, Object>> pageBean = novaTableData.getPageBean();
        Map<String, NovaTableData.Search> conditions = novaTableData.getConditions();
        List<PageBean.OrderItemBean> orders = pageBean.getOrders();
        QueryWrapper<Object> queryWrapper = new QueryWrapper<>();
        Map<String, FetchRequest.Source.Search> requestConditions = new LinkedHashMap<>();
        // 搜索条件
        if (conditions != null) {
            Map<String, NovaFieldUtils.DateInfo> dateMap = NovaFieldUtils.getDate(novaName);
            conditions.forEach((field, search) -> {
                String column = MixUtils.camelToSnake(field);
                NovaFieldUtils.DateInfo dateInfo = dateMap.get(field);
                FetchRequest.Source.Search searchBean = DataProxyUtils.buildFetchSearch(
                        novaName, field, column,
                        search.getValue(), search.getType(),
                        Boolean.TRUE.equals(search.getVague()),
                        dateInfo,
                        queryWrapper);
                requestConditions.put(field, searchBean);
            });
        }
        // 排序：前端指定 > @Nova orderBy > 无排序
        List<FetchRequest.Source.OrderItemBean> requestOrders = new ArrayList<>();
        if (orders != null && !orders.isEmpty()) {
            orders.forEach(o -> {
                String col = MixUtils.camelToSnake(o.getColumn());
                requestOrders.add(new FetchRequest.Source.OrderItemBean().setColumn(col).setAsc(o.isAsc()));
                if (o.isAsc()) queryWrapper.orderByAsc(col);
                else queryWrapper.orderByDesc(col);
            });
        } else {
            String defaultOrderBy = NovaUtils.getOrderBy(novaName);
            if (defaultOrderBy != null && !defaultOrderBy.isBlank()) {
                queryWrapper.last("ORDER BY " + defaultOrderBy);
            }
        }
        // 构造对象
        FetchRequest queryRequest = new FetchRequest()
                .setSource(new FetchRequest.Source()
                        .setCurrent(pageBean.getCurrent())
                        .setSize(pageBean.getSize())
                        .setConditions(requestConditions)
                        .setOrders(requestOrders)
                        .setNovaName(novaTableData.getSourceNovaName())
                        .setSourceFields(novaTableData.getSourceFields())
                )
                .setMybatisPLus(new FetchRequest.MybatisPLus()
                        .setPage(Page.of(pageBean.getCurrent(), pageBean.getSize()))
                        .setWrapper(queryWrapper.lambda())
                );
        // 调用代理
        DataProxy<?> dataProxy = DataProxyUtils.getDataProxy(novaName);
        FetchResponse<?> fetch = dataProxy.fetch(queryRequest);
        List<Map<String, Object>> maps = new ArrayList<>();
        List<?> records = fetch.getRecords();
        records.forEach(record -> maps.add(DataProxyUtils.toMapWithTimestamp(record)));
        pageBean.setTotal(fetch.getTotal()).setRecords(maps);
        return pageBean;
    }

    @Override
    public NovaTableAdd.Vo add(NovaTableAdd novaTableAdd) {
        String novaName = novaTableAdd.getNovaName();
        List<String> columns = new ArrayList<>();
        List<String> values = new ArrayList<>();
        for (NovaTableAdd.FormInfo formInfo : novaTableAdd.getFormInfo()) {
            String value = formInfo.getValue();
            if (value != null && !value.isEmpty()) {
                columns.add(MixUtils.camelToSnake(formInfo.getField()));
                values.add(value);
            }
        }
        Object model = DataProxyUtils.buildModel(novaName, columns, values);
        //noinspection unchecked,rawtypes
        ((DataProxy) DataProxyUtils.getDataProxy(novaName)).add(model);
        return new NovaTableAdd.Vo();
    }

    @Override
    public NovaTableUpdate.Vo update(NovaTableUpdate novaTableUpdate) {
        String novaName = novaTableUpdate.getNovaName();
        List<String> columns = new ArrayList<>();
        List<String> values = new ArrayList<>();
        for (NovaTableUpdate.FormInfo formInfo : novaTableUpdate.getFormInfo()) {
            columns.add(MixUtils.camelToSnake(formInfo.getField()));
            String value = formInfo.getValue();
            values.add((value == null || value.isEmpty()) ? null : value);
        }
        Object model = DataProxyUtils.buildModel(novaName, columns, values);
        //noinspection unchecked,rawtypes
        ((DataProxy) DataProxyUtils.getDataProxy(novaName)).update(model);
        return new NovaTableUpdate.Vo();
    }

    @Override
    public NovaTableDelete.Vo delete(NovaTableDelete novaTableDelete) {
        String novaName = novaTableDelete.getNovaName();
        String pkColumn = MixUtils.camelToSnake(novaTableDelete.getIdFieldName());
        List<Object> models = new ArrayList<>();
        for (String pk : novaTableDelete.getPkValues()) {
            models.add(DataProxyUtils.buildModel(novaName, List.of(pkColumn), List.of(pk)));
        }
        //noinspection unchecked,rawtypes
        ((DataProxy) DataProxyUtils.getDataProxy(novaName)).delete(models);
        return new NovaTableDelete.Vo();
    }

    @Override
    public PageBean<NovaTablePromptSearch.Vo> promptSearch(NovaTablePromptSearch novaTablePromptSearch) {
        PageBean<NovaTablePromptSearch.Vo> pageBean = novaTablePromptSearch.getPageBean();
        PromptSearchResponse promptSearchResponse = DataProxyUtils.getDataProxy(novaTablePromptSearch.getNovaName()).promptSearch(new PromptSearchRequest()
                .setCurrent(pageBean.getCurrent())
                .setSize(pageBean.getSize())
                .setNovaName(novaTablePromptSearch.getNovaName())
                .setPrompt(novaTablePromptSearch.getPrompt())
        );
        if (promptSearchResponse == null) {
            return pageBean;
        }
        List<PromptSearchResponse.Record> records = promptSearchResponse.getRecords();
        List<NovaTablePromptSearch.Vo> vos = new ArrayList<>();
        for (PromptSearchResponse.Record record : records) {
            NovaTablePromptSearch.Vo vo = new NovaTablePromptSearch.Vo()
                    .setStorageField(record.getStorageField())
                    .setDisplayField(record.getDisplayField());
            vos.add(vo);
        }
        pageBean.setTotal(promptSearchResponse.getTotal()).setRecords(vos);
        return pageBean;
    }

}
