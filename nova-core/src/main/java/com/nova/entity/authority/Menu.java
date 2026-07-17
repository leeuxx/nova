package com.nova.entity.authority;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class Menu {

    @Comment("id")
    private Long id;

    @Comment("编码")
    private String code;

    @Comment("名称")
    private String name;

    @Comment("类型 ")
    private Type type;

    @Comment("值")
    private String value;

    @Comment("图标")
    private String icon;

    @Comment("父级id")
    private Long pid;

    public enum Type {
        @Comment("目录")
        DIR,
        @Comment("nova视图")
        NOVA,
        @Comment("自定义视图")
        TPL,
        @Comment("按钮")
        BUTTON
    }
}
