package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface AI {

    @Comment("数据审查")
    Review review() default @Review(enable = false);

    @interface Review {

        @Comment("是否启用")
        boolean enable() default true;

        @Comment("提示词")
        String prompt() default "检查值合理性";

    }

}
