package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface Search {

    boolean value() default true;

    @Comment("高级查询")
    boolean vague() default false;

}
