package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface Ai {

    @Comment("是否开启智能搜索")
    boolean search() default false;

}
