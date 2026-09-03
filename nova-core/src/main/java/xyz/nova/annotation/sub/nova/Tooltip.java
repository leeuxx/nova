package xyz.nova.annotation.sub.nova;

import xyz.nova.annotation.comment.Comment;

public @interface Tooltip {

    @Comment("提示内容（静态）")
    @Comment("支持文本和html")
    String value() default "";

    @Comment("该配置可在tooltipHandler中获取")
    String param() default "";

    @Comment("提示内容（动态）")
    @Comment("支持文本和html")
    Class<? extends TooltipHandler> tooltipHandler() default TooltipHandler.class;

}
