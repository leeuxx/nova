package xyz.nova.cloud.controller;

import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.config.RestMappingController;
import xyz.nova.cloud.utils.NovaRpcUtils;
import xyz.nova.dto.NovaTplOpen;
import xyz.nova.service.NovaTplService;
import xyz.nova.utils.R;

@AllArgsConstructor
@RestMappingController("nova/tpl")
public class NovaTplController {

    private NovaTplService novaTplService;

    @Comment("获取tpl模版请求地址")
    @PostMapping("getTplPath")
    @NovaRouter
    public R<String> getTplPath(@RequestBody @Validated NovaTplOpen novaTplOpen) {
        return NovaRpcUtils.post(novaTplOpen.getNovaName(), "/nova/tpl/getTplPath", novaTplOpen, () -> {
            xyz.nova.controller.NovaTplController novaTplController = new xyz.nova.controller.NovaTplController(novaTplService);
            return novaTplController.getTplPath(novaTplOpen);
        });
    }

}
