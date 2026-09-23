package xyz.nova.controller;

import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.config.RestMappingController;
import xyz.nova.dto.NovaTableAdd;
import xyz.nova.service.NovaAiService;

@AllArgsConstructor
@RestMappingController("nova/ai")
public class NovaAiController {

    private NovaAiService novaAiService;

    @Comment("新增表格数据检查")
    @PostMapping("addSseEmitter")
    public SseEmitter addSseEmitter(@RequestBody @Validated NovaTableAdd novaTableAdd) {
        return novaAiService.addSseEmitter(novaTableAdd);
    }

}
