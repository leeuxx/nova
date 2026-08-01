package com.nova.entity.authority;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class EditUser {

    @Comment("名称,必填")
    private String name;

    @Comment("别名")
    private String alias;

    @Comment("头像")
    private String avatar;

}
