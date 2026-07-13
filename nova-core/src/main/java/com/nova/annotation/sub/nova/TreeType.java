package com.nova.annotation.sub.nova;

import com.nova.annotation.config.Comment;

public @interface TreeType {

    @Comment("是否树结构")
    boolean value() default true;

    @Comment("搜索条件字段")
    String searchField() default "";

}
