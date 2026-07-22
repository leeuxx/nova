package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface ButtonType {

    @Comment("id（可供js读取dom）")
    String id() default "";

    @Comment("按钮颜色")
    String color() default "#2563EB";

    @Comment("静态参数，可被buttonHandle和buttonHandleJs获取到")
    String param() default "";

    @Comment("当前类表单上下文信息，可被buttonHandle和buttonHandleJs获取到")
    String[] transmitParams() default {};

    @Comment("按钮点击处理（后端接口）")
    Class<? extends ButtonHandle>[] handle() default {};

    @Comment("按钮点击处理（前端js文件）")
    String handleJs() default "";

}
