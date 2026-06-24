package com.nova.annotation.sub.nova.field;

import com.nova.annotation.config.Comment;

public @interface View {

    @Comment("名称")
    String title();

    @Comment("详细说明")
    String desc() default "";

    @Comment("修饰类型为关联引用组件时必须指定列名")
    String column() default "";

    @Comment("列宽度（单位：%）")
    String width() default "";

    @Comment("是否显示")
    boolean show() default true;

    @Comment("排序列")
    boolean sortable() default false;

}
