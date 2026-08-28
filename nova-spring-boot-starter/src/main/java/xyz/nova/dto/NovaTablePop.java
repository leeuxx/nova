package xyz.nova.dto;

import xyz.nova.annotation.comment.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTablePop {

    @Comment("nova名称,必填")
    private String novaName;

    @Comment("处理类完全类名,必填")
    private String handleName;

    @Comment("点击的数据,必填")
    private String value;

    @Comment("静态参数")
    private String param;

    @Comment("同一行其他属性值")
    private Map<String, Object> context;

    @Data
    @Accessors(chain = true)
    public static class Vo {

        @Comment("类型")
        private String type;

        @Comment("名称")
        private String name;

        @Comment("值")
        private String value;

    }
}
