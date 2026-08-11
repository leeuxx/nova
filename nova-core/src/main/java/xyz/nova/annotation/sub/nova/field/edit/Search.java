package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.row.ExprBool;

public @interface Search {

    @Comment("是否搜索项")
    boolean value() default true;

    @Comment("高级查询")
    boolean vague() default false;

    @Comment("显示顺序,正序")
    int sort() default 0;

    @Comment("是否显示控制")
    ExprBool show() default @ExprBool;

}
