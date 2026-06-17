package com.nova.service;

import com.nova.annotation.Comment;
import com.nova.annotation.RestMappingController;
import com.nova.dto.NovaTableBuild;
import com.nova.dto.NovaTableData;
import com.nova.dto.page.PageBean;

import java.util.Map;

@RestMappingController("nova/table")
public interface NovaTableService {

    @Comment("构建表格页")
    NovaTableBuild.Vo build(NovaTableBuild novaTableBuild);

    @Comment("获取表格数据")
    PageBean<Map<String, Object>> data(NovaTableData novaTableData);
}
