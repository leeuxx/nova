package xyz.nova.annotation.sub.nova.field.view;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.row.ExprBool;

public @interface Pop {

    @Comment("标题")
    String title();

    @Comment("是否显示")
    ExprBool show() default @ExprBool;

    @Comment("可被popHandler接口获取到")
    String param() default "";

    @Comment("额外传递的同一行属性，可被popHandler接口获取到")
    String[] context() default {};

    @Comment("弹窗处理类")
    Class<? extends PopHandler> popHandler() default PopHandler.class;

}
