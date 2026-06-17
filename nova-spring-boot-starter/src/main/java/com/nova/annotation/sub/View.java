package com.nova.annotation.sub;

import com.nova.annotation.Comment;

public @interface View {

    @Comment("名称")
    String title();

    @Comment("详细说明")
    String desc() default "";

    @Comment("列宽度（请指定单位如：%、px）")
    String width() default "";

    @Comment("是否显示")
    boolean show() default true;

    @Comment("排序列")
    boolean sortable() default false;

}
