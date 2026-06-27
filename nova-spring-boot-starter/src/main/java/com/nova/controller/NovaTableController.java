package com.nova.controller;

import com.nova.annotation.config.Comment;
import com.nova.annotation.config.RestMappingController;
import com.nova.dto.*;
import com.nova.dto.page.PageBean;
import com.nova.service.NovaTableService;
import com.nova.utils.R;
import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
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
    public R<PageBean<?>> data(@RequestBody @Validated NovaTableData novaTableData) {
        PageBean<?> pageBean = novaTableService.data(novaTableData);
        return R.ok(pageBean);
    }

    @Comment("新增表格数据")
    @PostMapping("add")
    public R<NovaTableAdd.Vo> add(@RequestBody @Validated NovaTableAdd novaTableAdd) {
        NovaTableAdd.Vo add = novaTableService.add(novaTableAdd);
        return R.ok(add);
    }

    @Comment("获取表格引用数据")
    @PostMapping("referencesData")
    public R<Map<String, Map<String, Map<String, Object>>>> referencesData(@RequestBody @Validated List<NovaTableReferencesData> novaTableReferencesDatas) {
        Map<String, Map<String, Map<String, Object>>> mapMap = novaTableService.referencesData(novaTableReferencesDatas);
        return R.ok(mapMap);
    }

    @Comment("修改表格数据")
    @PostMapping("update")
    public R<NovaTableUpdate.Vo> update(@RequestBody @Validated NovaTableUpdate novaTableUpdate) {
        NovaTableUpdate.Vo update = novaTableService.update(novaTableUpdate);
        return R.ok(update);
    }

    @Comment("删除表格数据")
    @PostMapping("delete")
    public R<NovaTableDelete.Vo> delete(@RequestBody @Validated NovaTableDelete novaTableDelete) {
        NovaTableDelete.Vo delete = novaTableService.delete(novaTableDelete);
        return R.ok(delete);
    }

    @Comment("关键词搜索")
    @PostMapping("promptSearch")
    public R<PageBean<NovaTablePromptSearch.Vo>> promptSearch(@RequestBody @Validated NovaTablePromptSearch novaTablePromptSearch) {
        PageBean<NovaTablePromptSearch.Vo> pageBean = novaTableService.promptSearch(novaTablePromptSearch);
        return R.ok(pageBean);
    }
}
