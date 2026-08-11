package xyz.nova.dto;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.dto.page.PageBean;

import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTableData {

    @Comment("nova名称,必填")
    private String novaName;

    @Comment("来源nova名称,必填")
    private String sourceNovaName;

    @Comment("分页信息,必填")
    private PageBean<Map<String, Object>> pageBean;

    @Comment("查询条件")
    private Map<String, String> conditions;

    @Comment("来源上下文属性集合")
    private Map<String, String> sourceFields;
}
