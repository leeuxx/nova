package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface ShowBy {

    @Comment("条件表达式，纯前端实现，使用字段属性名来运算")
    @Comment("比较运算符：（== != > >= < <=）逻辑运算符：（&& || 括号分组）")
    String value();

}
