package com.nova.service;

import com.nova.annotation.Comment;
import com.nova.annotation.RestMappingController;
import com.nova.dto.NovaTableAdd;
import com.nova.dto.NovaTableBuild;
import com.nova.dto.NovaTableData;
import com.nova.dto.NovaTableDelete;
import com.nova.dto.NovaTableTranslate;
import com.nova.dto.NovaTableUpdate;
import com.nova.dto.page.PageBean;

import java.util.Map;

@RestMappingController("nova/table")
public interface NovaTableService {

    @Comment("构建表格页")
    NovaTableBuild.Vo build(NovaTableBuild novaTableBuild);

    @Comment("获取表格数据")
    PageBean<Map<String, Object>> data(NovaTableData novaTableData);

    @Comment("翻译表格数据")
    NovaTableTranslate.Vo translate(NovaTableTranslate novaTableTranslate);

    @Comment("新增表格数据")
    NovaTableAdd.Vo add(NovaTableAdd novaTableAdd);

    @Comment("修改表格数据")
    NovaTableUpdate.Vo update(NovaTableUpdate novaTableUpdate);

    @Comment("删除表格数据")
    NovaTableDelete.Vo delete(NovaTableDelete novaTableDelete);

}
