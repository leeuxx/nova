package com.nova.controller;

import com.nova.annotation.Comment;
import com.nova.annotation.RestMappingController;
import com.nova.dto.NovaTableBuild;
import com.nova.dto.NovaTableData;
import com.nova.dto.page.PageBean;
import com.nova.service.NovaTableService;
import com.nova.utils.R;
import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@AllArgsConstructor
@RestMappingController("nova/table")
public class NovaTableController {

    private NovaTableService novaTableService;

    @Comment("构建表格页")
    @PostMapping("build")
    public R<NovaTableBuild.Vo> build(@RequestBody @Validated NovaTableBuild novaTableBuild) {
        NovaTableBuild.Vo vo = novaTableService.build(novaTableBuild);
        return R.ok(vo);
    }

    @Comment("获取表格数据")
    @PostMapping("data")
    public R<PageBean<Map<String, Object>>> data(@RequestBody @Validated NovaTableData novaTableData) {
        PageBean<Map<String, Object>> data = novaTableService.data(novaTableData);
        return R.ok(data);
    }
}
