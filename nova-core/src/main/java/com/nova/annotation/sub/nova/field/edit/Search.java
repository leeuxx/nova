package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface Search {

    @Comment("是否搜索项")
    boolean value() default true;

    @Comment("高级查询")
    boolean vague() default false;

    @Comment("显示顺序,正序")
    int sort() default 0;
}
