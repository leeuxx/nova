package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface Ai {

    @Comment("是否开启ai搜索")
    boolean search() default false;

}
