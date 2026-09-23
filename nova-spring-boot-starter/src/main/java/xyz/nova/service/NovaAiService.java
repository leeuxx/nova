package xyz.nova.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.dto.NovaTableAdd;

public interface NovaAiService {

    @Comment("新增表格数据检查")
    SseEmitter addSseEmitter(NovaTableAdd novaTableAdd);

}
