package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface LinkType {

    @Comment("中间类获取目标引用类数据时（弹窗选取），额外透传向引用类 DataProxy.fetch 传递的当前类表单上下文信息，用于动态筛选")
    String[] referenceTransmitField() default {};

    @Comment("tap页显示")
    boolean tapShow() default true;

    @Comment("tap页是否显示动态判断,使用此方式必须把show设置为true")
    ShowBy tapShowBy() default @ShowBy("");

}
