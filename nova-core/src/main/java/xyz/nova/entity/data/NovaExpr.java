package xyz.nova.entity.data;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.comment.Comment;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaExpr {

    @Comment("实际查询字段名")
    private String field;

    @Comment("字段显示名(仅用于前端展示)")
    private String title;

    @Comment("操作符")
    private Op op = Op.EQ;

    @Comment("值(原样字符串)")
    private List<String> values;

    public enum Op {
        EQ, NE, GT, GE, LT, LE, BETWEEN, IN, LIKE, IS_NULL, IS_NOT_NULL
    }

}
