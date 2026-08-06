package xyz.nova.controller;

import xyz.nova.annotation.NovaRouter;
import xyz.nova.annotation.config.Comment;
import xyz.nova.annotation.config.RestMappingController;
import xyz.nova.dto.NovaTplOpen;
import xyz.nova.service.NovaTplService;
import xyz.nova.utils.R;
import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@AllArgsConstructor
@RestMappingController("nova/tpl")
public class NovaTplController {

    private NovaTplService novaTplService;

    @Comment("获取tpl模版请求地址")
    @PostMapping("getTplPath")
    @NovaRouter
    public R<String> getTplPath(@RequestBody @Validated NovaTplOpen novaTplOpen) {
        String tplPath = novaTplService.getTplPath(novaTplOpen);
        return R.ok(tplPath);
    }

}
