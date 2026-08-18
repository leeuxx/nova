package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.row.ExprBool;

public @interface LinkType {

    @Comment("中间类获取目标类数据时（弹窗选取）,额外传递的当前类表单上下文信息，用于动态筛选")
    String[] context() default {};

    @Comment("tap页显示")
    boolean tapShow() default true;

    @Comment("tap页是否显示动态判断,使用此方式必须把tapShow设置为true（前端控制,根据某些属性动态显示tap页）")
    ShowBy tapShowBy() default @ShowBy("");

    @Comment("控制tap页和双表视图的显示与隐藏,使用此方式必须把tapShow和dualTable设置为true（后端控制,多用于访问权限）")
    ExprBool show() default @ExprBool;

    @Comment("是否支持双表视图")
    boolean dualTable() default true;
}
