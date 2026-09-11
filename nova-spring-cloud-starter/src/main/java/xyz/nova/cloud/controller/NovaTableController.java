package xyz.nova.cloud.controller;

import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.config.RestMappingController;
import xyz.nova.cloud.utils.NovaRpcUtils;
import xyz.nova.dto.*;
import xyz.nova.dto.page.PageBean;
import xyz.nova.service.NovaTableService;
import xyz.nova.utils.R;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@RestMappingController("nova/table")
public class NovaTableController {

    private NovaTableService novaTableService;

    @Comment("构建表格页")
    @PostMapping("build")
    @NovaRouter(verifyType = NovaRouter.VerifyType.LOGIN_MENU)
    public R<NovaTableBuild.Vo> build(@RequestBody @Validated NovaTableBuild novaTableBuild) {
        return NovaRpcUtils.post(novaTableBuild.getNovaName(), "nova/table/build", novaTableBuild, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.build(novaTableBuild);
        });
    }

    @Comment("获取表格数据")
    @PostMapping("data")
    @NovaRouter(verifyType = NovaRouter.VerifyType.LOGIN_MENU)
    public R<PageBean<?>> data(@RequestBody @Validated NovaTableData novaTableData) {
        return NovaRpcUtils.post(novaTableData.getNovaName(), "nova/table/data", novaTableData, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.data(novaTableData);
        });
    }

    @Comment("获取数据详情")
    @PostMapping("details")
    @NovaRouter
    public R<Map<String, Object>> details(@RequestBody @Validated NovaTableDetails novaTableDetails) {
        return NovaRpcUtils.post(novaTableDetails.getNovaName(), "nova/table/details", novaTableDetails, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.details(novaTableDetails);
        });
    }

    @Comment("新增表格数据")
    @PostMapping("add")
    @NovaRouter
    public R<NovaTableAdd.Vo> add(@RequestBody @Validated NovaTableAdd novaTableAdd) {
        return NovaRpcUtils.post(novaTableAdd.getNovaName(), "nova/table/add", novaTableAdd, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.add(novaTableAdd);
        });
    }

    @Comment("新增LINK_TARGET关联数据")
    @PostMapping("addLinkTarget")
    @NovaRouter
    public R<NovaTableAdd.Vo> addLinkTarget(@RequestBody @Validated NovaTableAdd novaTableAdd) {
        return NovaRpcUtils.post(novaTableAdd.getNovaName(), "nova/table/addLinkTarget", novaTableAdd, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.addLinkTarget(novaTableAdd);
        });
    }

    @Comment("关键词搜索")
    @PostMapping("promptSearch")
    @NovaRouter
    public R<PageBean<NovaTablePromptSearch.Vo>> promptSearch(@RequestBody @Validated NovaTablePromptSearch novaTablePromptSearch) {
        return NovaRpcUtils.post(novaTablePromptSearch.getNovaName(), "nova/table/promptSearch", novaTablePromptSearch, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.promptSearch(novaTablePromptSearch);
        });
    }

    @Comment("修改表格数据")
    @PostMapping("update")
    @NovaRouter
    public R<NovaTableUpdate.Vo> update(@RequestBody @Validated NovaTableUpdate novaTableUpdate) {
        return NovaRpcUtils.post(novaTableUpdate.getNovaName(), "nova/table/update", novaTableUpdate, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.update(novaTableUpdate);
        });
    }

    @Comment("删除表格数据")
    @PostMapping("delete")
    @NovaRouter
    public R<NovaTableDelete.Vo> delete(@RequestBody @Validated NovaTableDelete novaTableDelete) {
        return NovaRpcUtils.post(novaTableDelete.getNovaName(), "nova/table/delete", novaTableDelete, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.delete(novaTableDelete);
        });
    }

    @Comment("自定义按钮提交")
    @PostMapping("rowOperationSubmit")
    @NovaRouter
    public R<NovaTableRowOperationSubmit.Vo> rowOperationSubmit(@RequestBody @Validated NovaTableRowOperationSubmit req) {
        return NovaRpcUtils.post(req.getNovaName(), "nova/table/rowOperationSubmit", req, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.rowOperationSubmit(req);
        });
    }

    @Comment("自定义按钮表单初始值加载")
    @PostMapping("rowOperationLoad")
    @NovaRouter
    public R<Map<String, Map<String, Object>>> rowOperationLoad(@RequestBody @Validated NovaTableRowOperationLoad req) {
        return NovaRpcUtils.post(req.getNovaName(), "nova/table/rowOperationLoad", req, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.rowOperationLoad(req);
        });
    }

    @Comment("获取树形结构数据")
    @PostMapping("tree")
    @NovaRouter(verifyType = NovaRouter.VerifyType.LOGIN_MENU)
    public R<NovaTableTree.Vo> tree(@RequestBody @Validated NovaTableTree req) {
        return NovaRpcUtils.post(req.getNovaName(), "nova/table/tree", req, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.tree(req);
        });
    }

    @Comment("获取树形结构引用反显数据")
    @PostMapping("treeDisplay")
    @NovaRouter(verifyType = NovaRouter.VerifyType.LOGIN_MENU)
    public R<List<?>> treeDisplay(@RequestBody @Validated NovaTableTree req) {
        return NovaRpcUtils.post(req.getNovaName(), "nova/table/treeDisplay", req, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.treeDisplay(req);
        });
    }

    @Comment("按钮组件点击")
    @PostMapping("buttonClick")
    @NovaRouter
    public R<NovaTableButton.Vo> buttonClick(@RequestBody @Validated NovaTableButton req) {
        return NovaRpcUtils.post(req.getNovaName(), "nova/table/buttonClick", req, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.buttonClick(req);
        });
    }

    @Comment("弹窗点击")
    @PostMapping("pop")
    @NovaRouter
    public R<List<NovaTablePop.Vo>> pop(@RequestBody @Validated NovaTablePop novaTablePop) {
        return NovaRpcUtils.post(novaTablePop.getNovaName(), "nova/table/pop", novaTablePop, () -> {
            xyz.nova.controller.NovaTableController novaTableController = new xyz.nova.controller.NovaTableController(novaTableService);
            return novaTableController.pop(novaTablePop);
        });
    }

}
