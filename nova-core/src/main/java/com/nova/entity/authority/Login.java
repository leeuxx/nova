package com.nova.entity.authority;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class Login {

    @Comment("username")
    private String username;

    @Comment("password")
    private String password;

    @Data
    @Accessors(chain = true)
    public static class User {

        @Comment("token,必填")
        private String token;

        @Comment("名称,必填")
        private String name;

        @Comment("别名")
        private String alias;

        @Comment("头像")
        private String avatar;

    }

}
