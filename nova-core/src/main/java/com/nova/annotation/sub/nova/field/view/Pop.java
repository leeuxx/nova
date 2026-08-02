package com.nova.annotation.sub.nova.field.view;

import com.nova.annotation.config.Comment;

public @interface Pop {

    @Comment("标题")
    String title();

    @Comment("是否显示")
    boolean show() default true;

    @Comment("可被popHandler接口获取到")
    String param() default "";

    @Comment("弹窗处理类")
    Class<? extends PopHandler>[] popHandler() default {};

}
