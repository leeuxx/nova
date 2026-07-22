package com.nova.controller;

import com.nova.annotation.NovaRouter;
import com.nova.annotation.config.Comment;
import com.nova.annotation.config.RestMappingController;
import com.nova.dto.NovaTplOpen;
import com.nova.service.NovaTplService;
import com.nova.utils.R;
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
