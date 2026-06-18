package com.nova.service;

import com.nova.dto.NovaTableAdd;
import com.nova.dto.NovaTableBuild;
import com.nova.dto.NovaTableData;
import com.nova.dto.NovaTableDelete;
import com.nova.dto.NovaTableTranslate;
import com.nova.dto.NovaTableUpdate;
import com.nova.dto.page.PageBean;
import com.nova.mapper.NovaTableMapper;
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

    private NovaTableMapper novaTableMapper;

    @Override
    public NovaTableBuild.Vo build(NovaTableBuild novaTableBuild) {
        NovaTableBuild.Vo vo = new NovaTableBuild.Vo();
        // 获取搜索条件
        List<NovaTableBuild.Vo.Search> searchList = new ArrayList<>();
        List<NovaFieldUtils.SearchInfo> searchs = NovaFieldUtils.getSearch(novaTableBuild.getNovaName());
        for (NovaFieldUtils.SearchInfo search : searchs) {
            // 构造返回值
            searchList.add(new NovaTableBuild.Vo.Search()
                    .setField(search.getField())
                    .setTitle(search.getTitle())
                    .setType(search.getType())
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
                    .setType(tableColumn.getType())
            );
        }
        vo.setTableColumns(tableColumnList);
        // 获取功能布局
        NovaUtils.LayoutInfo layoutInfo = NovaUtils.getLayout(novaTableBuild.getNovaName());
        vo.setLayout(new NovaTableBuild.Vo.Layout()
                .setEditLayout(layoutInfo.getEditLayout())
                .setPageSize(layoutInfo.getPageSize())
                .setPageSizes(layoutInfo.getPageSizes())
        );
        // 获取编辑信息
        List<NovaTableBuild.Vo.Edit> editList = new ArrayList<>();
        List<NovaFieldUtils.EditInfo> editInfos = NovaFieldUtils.getEdit(novaTableBuild.getNovaName());
        for (NovaFieldUtils.EditInfo editInfo : editInfos) {
            editList.add(new NovaTableBuild.Vo.Edit()
                    .setField(editInfo.getField())
                    .setTitle(editInfo.getTitle())
                    .setType(editInfo.getType())
                    .setNotNull(editInfo.getNotNull())
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
                    .setSelectType(choiceInfo.getSelectType())
                    .setValues(buildValues)
            );
        });
        vo.setChoice(choiceMap);
        // 获取日期时间组件信息
        Map<String, NovaTableBuild.Vo.Date> dateMap = new LinkedHashMap<>();
        Map<String, NovaFieldUtils.DateInfo> dates = NovaFieldUtils.getDate(novaTableBuild.getNovaName());
        dates.forEach((field, dateInfo) -> {
            NovaTableBuild.Vo.Date date = new NovaTableBuild.Vo.Date()
                    .setType(dateInfo.getType())
                    .setPickerMode(dateInfo.getPickerMode());
            dateMap.put(field, date);
        });
        vo.setDate(dateMap);
        return vo;
    }

    @Override
    public PageBean<Map<String, Object>> data(NovaTableData novaTableData) {
        String novaName = novaTableData.getNovaName();
        PageBean<Map<String, Object>> pageBean = novaTableData.getPageBean();
        NovaUtils.SqlInfo novaSqlInfo = NovaUtils.getSqlInfo(novaName);
        NovaFieldUtils.SqlInfo novaFieldSqlInfo = NovaFieldUtils.getSqlInfo(novaName);
        List<String> columnNames = novaFieldSqlInfo.getColumnNames();
        String orderBy = buildOrderBy(pageBean.getOrders(), columnNames, novaSqlInfo.getOrderBy());
        List<NovaTableMapper.Condition> conditions = buildConditions(novaTableData.getConditions(), columnNames);
        Long total = novaTableMapper.count(novaSqlInfo.getTableName(), conditions);
        long offset = (pageBean.getCurrent() - 1) * pageBean.getSize();
        List<Map<String, Object>> records = novaTableMapper.selectPage(novaSqlInfo.getTableName(), columnNames, conditions, orderBy, offset, pageBean.getSize());
        pageBean.setPkFieldName(NovaFieldUtils.getPkFieldName(novaName))
                .setTotal(total)
                .setRecords(MixUtils.convertToCamelCase(records));
        return pageBean;
    }

    @Override
    public NovaTableTranslate.Vo translate(NovaTableTranslate novaTableTranslate) {
        Map<String, List<String>> result = new LinkedHashMap<>();
        Map<String, NovaTableTranslate.DataInfo> dataInfos = novaTableTranslate.getDataInfos();
        dataInfos.forEach((field, dataInfo) -> {
            String type = dataInfo.getType();
            List<String> datas = dataInfo.getDatas();
            List<String> values = new ArrayList<>();
            datas.forEach(data -> {
                // 空值跳过
                if (data == null || data.isEmpty()) {
                    values.add(data);
                    return;
                }

            });
            result.put(field, values);
        });
        return new NovaTableTranslate.Vo().setDataInfos(result);
    }

    @Override
    public NovaTableAdd.Vo add(NovaTableAdd novaTableAdd) {
        String novaName = novaTableAdd.getNovaName();
        NovaUtils.SqlInfo novaSqlInfo = NovaUtils.getSqlInfo(novaName);
        NovaFieldUtils.SqlInfo novaFieldSqlInfo = NovaFieldUtils.getSqlInfo(novaName);
        List<String> allowedColumns = novaFieldSqlInfo.getColumnNames();
        List<String> columns = new ArrayList<>();
        List<String> values = new ArrayList<>();
        for (NovaTableAdd.FormInfo formInfo : novaTableAdd.getFormInfo()) {
            String value = formInfo.getValue();
            if (value != null && !value.isEmpty()) {
                String columnName = MixUtils.camelToSnake(formInfo.getField());
                if (!allowedColumns.contains(columnName)) {
                    throw new IllegalArgumentException("Invalid column: " + formInfo.getField());
                }
                columns.add(columnName);
                values.add(value);
            }
        }
        novaTableMapper.insert(novaSqlInfo.getTableName(), columns, values);
        return new NovaTableAdd.Vo();
    }

    @Override
    public NovaTableUpdate.Vo update(NovaTableUpdate novaTableUpdate) {
        String novaName = novaTableUpdate.getNovaName();
        NovaUtils.SqlInfo novaSqlInfo = NovaUtils.getSqlInfo(novaName);
        NovaFieldUtils.SqlInfo novaFieldSqlInfo = NovaFieldUtils.getSqlInfo(novaName);
        List<String> allowedColumns = novaFieldSqlInfo.getColumnNames();
        String pkColumn = MixUtils.camelToSnake(NovaFieldUtils.getPkFieldName(novaName));
        List<String> columns = new ArrayList<>();
        List<String> values = new ArrayList<>();
        for (NovaTableUpdate.FormInfo formInfo : novaTableUpdate.getFormInfo()) {
            String columnName = MixUtils.camelToSnake(formInfo.getField());
            if (!allowedColumns.contains(columnName)) {
                throw new IllegalArgumentException("Invalid column: " + formInfo.getField());
            }
            columns.add(columnName);
            String value = formInfo.getValue();
            values.add((value == null || value.isEmpty()) ? null : value);
        }
        novaTableMapper.update(novaSqlInfo.getTableName(), columns, values, pkColumn, novaTableUpdate.getPkValue());
        return new NovaTableUpdate.Vo();
    }

    @Override
    public NovaTableDelete.Vo delete(NovaTableDelete novaTableDelete) {
        String novaName = novaTableDelete.getNovaName();
        NovaUtils.SqlInfo novaSqlInfo = NovaUtils.getSqlInfo(novaName);
        String pkColumn = MixUtils.camelToSnake(NovaFieldUtils.getPkFieldName(novaName));
        novaTableMapper.delete(novaSqlInfo.getTableName(), pkColumn, novaTableDelete.getPkValues());
        return new NovaTableDelete.Vo();
    }

    /**
     * 构建查询条件
     */
    private List<NovaTableMapper.Condition> buildConditions(Map<String, NovaTableData.Search> conditions, List<String> columnNames) {
        List<NovaTableMapper.Condition> result = new ArrayList<>();
        if (conditions == null || conditions.isEmpty()) {
            return result;
        }
        for (Map.Entry<String, NovaTableData.Search> entry : conditions.entrySet()) {
            String columnName = MixUtils.camelToSnake(entry.getKey());
            if (!columnNames.contains(columnName)) {
                throw new IllegalArgumentException("Invalid column: " + entry.getKey());
            }
            NovaTableData.Search search = entry.getValue();
            String value = search.getValue();
            String ext = search.getExt();
            // DATE+vague 时拆分 "start,end" 分别存入 value 和 ext
            if ("DATE".equals(search.getType()) && Boolean.TRUE.equals(search.getVague())
                    && value != null && value.indexOf(',') >= 0) {
                String[] parts = value.split(",", 2);
                value = parts[0];
                ext = parts[1];
            }
            result.add(new NovaTableMapper.Condition()
                    .setColumn(columnName)
                    .setValue(value)
                    .setType(search.getType())
                    .setExt(ext)
                    .setVague(search.getVague()));
        }
        return result;
    }

    /**
     * 构建排序条件
     */
    private String buildOrderBy(List<PageBean.OrderItemBean> orders, List<String> columnNames, String defaultOrderBy) {
        if (orders != null && !orders.isEmpty()) {
            StringBuilder orderBy = new StringBuilder("ORDER BY ");
            for (int i = 0; i < orders.size(); i++) {
                PageBean.OrderItemBean order = orders.get(i);
                String column = order.getColumn();
                if (!columnNames.contains(column)) {
                    throw new IllegalArgumentException("Invalid column: " + column);
                }
                if (i > 0) orderBy.append(", ");
                orderBy.append(column).append(order.isAsc() ? " ASC" : " DESC");
            }
            return orderBy.toString();
        }
        if (defaultOrderBy != null && !defaultOrderBy.isBlank()) {
            return "ORDER BY " + defaultOrderBy;
        }
        return "";
    }
}
