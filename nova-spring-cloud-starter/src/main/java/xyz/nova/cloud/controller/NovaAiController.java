package xyz.nova.cloud.controller;

import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.config.RestMappingController;
import xyz.nova.cloud.utils.NovaRpcUtils;
import xyz.nova.dto.NovaTableAdd;
import xyz.nova.service.NovaAiService;

@AllArgsConstructor
@RestMappingController("nova/ai")
public class NovaAiController {

    private NovaAiService novaAiService;

    @Comment("新增数据审查")
    @PostMapping("addSseEmitter")
    @NovaRouter
    public SseEmitter addSseEmitter(@RequestBody @Validated NovaTableAdd novaTableAdd) {
        SseEmitter emitter = new SseEmitter(60000L);
        return NovaRpcUtils.postStream(novaTableAdd.getNovaName(), "nova/ai/addSseEmitter", novaTableAdd, emitter, () -> {
            xyz.nova.controller.NovaAiController novaAiController = new xyz.nova.controller.NovaAiController(novaAiService);
            return novaAiController.addSseEmitter(novaTableAdd);
        });
    }
}
