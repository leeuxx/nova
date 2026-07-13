package com.nova.service;

import com.nova.annotation.config.Comment;
import com.nova.dto.*;
import com.nova.dto.page.PageBean;

import java.util.List;
import java.util.Map;

public interface NovaTableService {

    @Comment("构建表格页")
    NovaTableBuild.Vo build(NovaTableBuild novaTableBuild);

    @Comment("获取表格数据")
    PageBean<?> data(NovaTableData novaTableData);

    @Comment("获取数据详情")
    Map<String, Object> details(NovaTableDetails novaTableDetails);

    @Comment("关键词搜索")
    PageBean<NovaTablePromptSearch.Vo> promptSearch(NovaTablePromptSearch novaTablePromptSearch);

    @Comment("新增表格数据")
    NovaTableAdd.Vo add(NovaTableAdd novaTableAdd);

    @Comment("新增LINK_TARGET关联数据")
    NovaTableAdd.Vo addLinkTarget(NovaTableAdd novaTableAdd);

    @Comment("修改表格数据")
    NovaTableUpdate.Vo update(NovaTableUpdate novaTableUpdate);

    @Comment("删除表格数据")
    NovaTableDelete.Vo delete(NovaTableDelete novaTableDelete);

    @Comment("自定义按钮初始化条件nova表单的值")
    Map<String, Map<String, Object>> rowOperationLoad(NovaTableRowOperationLoad novaTableRowOperationLoad);

    @Comment("自定义按钮提交")
    NovaTableRowOperationSubmit.Vo rowOperationSubmit(NovaTableRowOperationSubmit novaTableRowOperationSubmit);

    @Comment("获取树形结构数据")
    NovaTableTree.Vo tree(NovaTableTree novaTableTree);
}
