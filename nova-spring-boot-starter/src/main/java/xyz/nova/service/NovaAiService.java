package xyz.nova.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.dto.NovaTableAdd;
import xyz.nova.entity.data.NovaExpr;

import java.util.List;

public interface NovaAiService {

    @Comment("新增表格数据检查")
    SseEmitter addSseEmitter(NovaTableAdd novaTableAdd);

    @Comment("提示词解析为表达式查询条件")
    List<NovaExpr> parseSearch(String novaName, String prompt);

}
