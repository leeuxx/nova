package xyz.nova.annotation.sub.nova;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.field.edit.ShowBy;

public @interface SysBtnHide {

    @Comment("编辑按钮表达式（满足则隐藏）")
    ShowBy edit() default @ShowBy("");

    @Comment("删除按钮表达式（满足则隐藏）")
    ShowBy delete() default @ShowBy("");

}
