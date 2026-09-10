package xyz.nova.entity.data;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.comment.Comment;

@Data
@Accessors(chain = true)
public class Details {

    @Comment("nova名称")
    private String novaName;

    @Comment("来源类型")
    private Type type;

    @Comment("来源值")
    private String value;

    public enum Type {
        @Comment("自身novaId")
        NOVA_ID,
        @Comment("关联字段")
        REFERENCE_ID
    }
}
