package com.nova.controller;

import com.nova.annotation.NovaRouter;
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

import java.util.Map;

@AllArgsConstructor
@RestMappingController("nova/table")
public class NovaTableController {

    private NovaTableService novaTableService;

    @Comment("构建表格页")
    @PostMapping("build")
    @NovaRouter(verifyType = NovaRouter.VerifyType.LOGIN_MENU)
    public R<NovaTableBuild.Vo> build(@RequestBody @Validated NovaTableBuild novaTableBuild) {
        NovaTableBuild.Vo vo = novaTableService.build(novaTableBuild);
        return R.ok(vo);
    }

    @Comment("获取表格数据")
    @PostMapping("data")
    @NovaRouter(verifyType = NovaRouter.VerifyType.LOGIN_MENU)
    public R<PageBean<?>> data(@RequestBody @Validated NovaTableData novaTableData) {
        PageBean<?> pageBean = novaTableService.data(novaTableData);
        return R.ok(pageBean);
    }

    @Comment("获取数据详情")
    @PostMapping("details")
    @NovaRouter
    public R<Map<String, Object>> details(@RequestBody @Validated NovaTableDetails novaTableDetails) {
        Map<String, Object> map = novaTableService.details(novaTableDetails);
        return R.ok(map);
    }

    @Comment("新增表格数据")
    @PostMapping("add")
    @NovaRouter
    public R<NovaTableAdd.Vo> add(@RequestBody @Validated NovaTableAdd novaTableAdd) {
        NovaTableAdd.Vo add = novaTableService.add(novaTableAdd);
        return R.ok(add);
    }

    @Comment("新增LINK_TARGET关联数据")
    @PostMapping("addLinkTarget")
    @NovaRouter
    public R<NovaTableAdd.Vo> addLinkTarget(@RequestBody @Validated NovaTableAdd novaTableAdd) {
        NovaTableAdd.Vo add = novaTableService.addLinkTarget(novaTableAdd);
        return R.ok(add);
    }

    @Comment("关键词搜索")
    @PostMapping("promptSearch")
    @NovaRouter
    public R<PageBean<NovaTablePromptSearch.Vo>> promptSearch(@RequestBody @Validated NovaTablePromptSearch novaTablePromptSearch) {
        PageBean<NovaTablePromptSearch.Vo> pageBean = novaTableService.promptSearch(novaTablePromptSearch);
        return R.ok(pageBean);
    }

    @Comment("修改表格数据")
    @PostMapping("update")
    @NovaRouter
    public R<NovaTableUpdate.Vo> update(@RequestBody @Validated NovaTableUpdate novaTableUpdate) {
        NovaTableUpdate.Vo update = novaTableService.update(novaTableUpdate);
        return R.ok(update);
    }

    @Comment("删除表格数据")
    @PostMapping("delete")
    @NovaRouter
    public R<NovaTableDelete.Vo> delete(@RequestBody @Validated NovaTableDelete novaTableDelete) {
        NovaTableDelete.Vo delete = novaTableService.delete(novaTableDelete);
        return R.ok(delete);
    }

    @Comment("自定义按钮提交")
    @PostMapping("rowOperationSubmit")
    @NovaRouter
    public R<NovaTableRowOperationSubmit.Vo> rowOperationSubmit(@RequestBody @Validated NovaTableRowOperationSubmit req) {
        NovaTableRowOperationSubmit.Vo vo = novaTableService.rowOperationSubmit(req);
        return R.ok(vo);
    }

    @Comment("自定义按钮表单初始值加载")
    @PostMapping("rowOperationLoad")
    @NovaRouter
    public R<Map<String, Map<String, Object>>> rowOperationLoad(@RequestBody @Validated NovaTableRowOperationLoad req) {
        Map<String, Map<String, Object>> data = novaTableService.rowOperationLoad(req);
        return R.ok(data);
    }

    @Comment("获取树形结构数据")
    @PostMapping("tree")
    @NovaRouter(verifyType = NovaRouter.VerifyType.LOGIN_MENU)
    public R<NovaTableTree.Vo> tree(@RequestBody @Validated NovaTableTree req) {
        NovaTableTree.Vo tree = novaTableService.tree(req);
        return R.ok(tree);
    }

}
