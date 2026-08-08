package xyz.nova.entity.authority;

import xyz.nova.annotation.comment.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class Register {

    @Comment("username,必填")
    private String username;

    @Comment("password,必填")
    private String password;

    @Comment("名称,必填")
    private String name;

    @Comment("别名")
    private String alias;

}
