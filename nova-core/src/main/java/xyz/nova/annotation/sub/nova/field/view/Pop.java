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

    @Comment("弹窗处理类")
    Class<? extends PopHandler>[] popHandler() default {};

}
