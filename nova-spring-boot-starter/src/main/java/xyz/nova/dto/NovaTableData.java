package xyz.nova.dto;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.dto.page.PageBean;
import lombok.Data;
import lombok.experimental.Accessors;

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
    private Map<String, Search> conditions;

    @Comment("来源上下文属性集合")
    private Map<String, String> sourceFields;

    @Data
    @Accessors(chain = true)
    public static class Search {

        @Comment("属性值")
        private String value;

        @Comment("属性类型")
        private String type;

        @Comment("是否高级查询")
        private Boolean vague;

    }
}
