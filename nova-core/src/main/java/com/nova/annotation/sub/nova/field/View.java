package com.nova.annotation.sub.nova.field;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.field.view.Pop;
import com.nova.annotation.sub.nova.field.view.PopHandler;
import com.nova.annotation.sub.nova.row.ExprBool;

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
    ExprBool show() default @ExprBool;

    @Comment("排序列")
    boolean sortable() default false;

    @Comment("缺省值")
    String defaultValue() default "";

    @Comment("弹框内容")
    Pop pop() default @Pop(show = false, title = "");
}
