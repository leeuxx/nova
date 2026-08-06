package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.config.Comment;

public @interface VL {

    @Comment("值")
    String value();

    @Comment("标签")
    String label();

    @Comment("表格显示标签颜色（十六进制颜色代码）")
    String color() default "";

    @Comment("上级关联值（级联选择）")
    String refValue() default "";

}
