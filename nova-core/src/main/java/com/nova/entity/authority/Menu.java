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

    @Comment("类型 table=表格视图")
    private String type;

    @Comment("值")
    private String value;

    @Comment("图标")
    private String icon;

    @Comment("父级id")
    private Long pid;

}
