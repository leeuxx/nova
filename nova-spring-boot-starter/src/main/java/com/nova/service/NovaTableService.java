package com.nova.service;

import com.nova.annotation.config.Comment;
import com.nova.dto.*;
import com.nova.dto.page.PageBean;

public interface NovaTableService {

    @Comment("构建表格页")
    NovaTableBuild.Vo build(NovaTableBuild novaTableBuild);

    @Comment("获取表格数据")
    PageBean<?> data(NovaTableData novaTableData);

    @Comment("新增表格数据")
    NovaTableAdd.Vo add(NovaTableAdd novaTableAdd);

    @Comment("修改表格数据")
    NovaTableUpdate.Vo update(NovaTableUpdate novaTableUpdate);

    @Comment("删除表格数据")
    NovaTableDelete.Vo delete(NovaTableDelete novaTableDelete);

}
