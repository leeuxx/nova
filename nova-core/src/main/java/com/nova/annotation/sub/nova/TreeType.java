package com.nova.annotation.sub.nova;

import com.nova.annotation.config.Comment;

public @interface TreeType {

    @Comment("是否树结构")
    boolean value() default true;

    @Comment("搜索条件字段 & 树引用显示字段")
    String label();

    @Comment("父子勾选级联")
    boolean cascade() default true;

    @Comment("默认展开层级")
    int level() default 0;

}
