package xyz.nova.annotation.sub.nova;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.field.edit.ShowBy;

public @interface SysBtnShow {

    @Comment("编辑按钮表达式")
    ShowBy edit() default @ShowBy("");

    @Comment("删除按钮表达式")
    ShowBy delete() default @ShowBy("");

}
