package com.nova.service;

import com.nova.dto.NovaTableBuild;
import com.nova.dto.NovaTableData;
import com.nova.dto.page.PageBean;
import com.nova.mapper.NovaTableMapper;
import com.nova.utils.MixUtils;
import com.nova.utils.NovaFieldUtils;
import com.nova.utils.NovaUtils;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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
        List<NovaFieldUtils.SearchInfo> searchInfos = NovaFieldUtils.getSearch(novaTableBuild.getNovaName());
        for (NovaFieldUtils.SearchInfo searchInfo : searchInfos) {
            NovaFieldUtils.SearchInfo.ChoiceInfo choiceInfo = searchInfo.getChoiceInfo();
            NovaTableBuild.Vo.Search.ChoiceInfo choiceInfoVo = new NovaTableBuild.Vo.Search.ChoiceInfo()
                    .setSelectType(choiceInfo.getSelectType())
                    .setValues(choiceInfo.getValues());
            NovaTableBuild.Vo.Search search = new NovaTableBuild.Vo.Search()
                    .setField(searchInfo.getField())
                    .setTitle(searchInfo.getTitle())
                    .setType(searchInfo.getType())
                    .setVague(searchInfo.getVague())
                    .setChoiceInfo(choiceInfoVo);
            searchList.add(search);
        }
        vo.setSearch(searchList);
        // 获取表头列
        List<NovaTableBuild.Vo.TableColumn> tableColumnList = new ArrayList<>();
        List<NovaFieldUtils.TableColumnInfo> tableColumnInfos = NovaFieldUtils.getTableColumn(novaTableBuild.getNovaName());
        for (NovaFieldUtils.TableColumnInfo tableColumnInfo : tableColumnInfos) {
            NovaTableBuild.Vo.TableColumn tableColumn = new NovaTableBuild.Vo.TableColumn()
                    .setField(tableColumnInfo.getField())
                    .setTitle(tableColumnInfo.getTitle())
                    .setDesc(tableColumnInfo.getDesc())
                    .setWidth(tableColumnInfo.getWidth())
                    .setSortable(tableColumnInfo.getSortable());
            tableColumnList.add(tableColumn);
        }
        vo.setTableColumns(tableColumnList);
        // 获取功能布局
        NovaUtils.LayoutInfo layoutInfo = NovaUtils.getLayout(novaTableBuild.getNovaName());
        NovaTableBuild.Vo.LayoutInfo layout = new NovaTableBuild.Vo.LayoutInfo()
                .setEditLayout(layoutInfo.getEditLayout())
                .setPageSize(layoutInfo.getPageSize())
                .setPageSizes(layoutInfo.getPageSizes());
        vo.setLayout(layout);
        // 获取编辑信息
        List<NovaTableBuild.Vo.Edit> editList = new ArrayList<>();
        List<NovaFieldUtils.EditInfo> editInfos = NovaFieldUtils.getEdit(novaTableBuild.getNovaName());
        for (NovaFieldUtils.EditInfo editInfo : editInfos) {
            NovaFieldUtils.EditInfo.ChoiceInfo choiceInfo = editInfo.getChoiceInfo();
            NovaTableBuild.Vo.Edit.ChoiceInfo choiceInfoVo = new NovaTableBuild.Vo.Edit.ChoiceInfo()
                    .setSelectType(choiceInfo.getSelectType())
                    .setValues(choiceInfo.getValues());
            NovaTableBuild.Vo.Edit search = new NovaTableBuild.Vo.Edit()
                    .setField(editInfo.getField())
                    .setTitle(editInfo.getTitle())
                    .setType(editInfo.getType())
                    .setNotNull(editInfo.getNotNull())
                    .setChoiceInfo(choiceInfoVo);
            editList.add(search);
        }
        vo.setEdit(editList);
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
        List<Map<String, Object>> datas = MixUtils.convertToCamelCase(records);
        if (!datas.isEmpty()) {
            Map<String, Map<String, String>> choiceValues = NovaFieldUtils.getChoiceValues(novaName);
            // 循环行数据
            for (Map<String, Object> data : datas) {
                // 循环列数据
                data.forEach((key, value) -> {
                    if (value == null) {
                        return;
                    }
                    Map<String, String> map = choiceValues.get(key);
                    if (map == null || map.isEmpty()) {
                        return;
                    }
                    String label = map.get(value.toString());
                    data.put(key, label);
                });
            }
        }
        pageBean.setPkFieldName(NovaFieldUtils.getPkFieldName(novaName))
                .setTotal(total)
                .setRecords(datas);
        return pageBean;
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
            result.add(new NovaTableMapper.Condition()
                    .setColumn(columnName)
                    .setValue(search.getValue())
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
