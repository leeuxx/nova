package xyz.nova.annotation.sub.nova.row;

import xyz.nova.annotation.comment.Comment;

public @interface ExprBool {

    @Comment("静态是否显示")
    boolean value() default true;

    @Comment("该配置可在exprHandler中获取")
    String param() default "";

    @Comment("动态是否显示，使用此方式必须把value设置为true")
    Class<? extends ExprHandler> exprHandler() default ExprHandler.class;

    interface ExprHandler {

        /**
         * @param param 注解参数
         * @return 是否显示
         */
        boolean handler(String param);
    }

}
