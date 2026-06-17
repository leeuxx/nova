package com.nova.annotation.sub.edit;

import com.nova.annotation.Comment;

public @interface Search {

    boolean value() default true;

    @Comment("高级查询")
    boolean vague() default false;

}
