package com.nova.annotation.sub.nova.field;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.field.edit.ChoiceType;
import com.nova.annotation.sub.nova.field.edit.DateType;
import com.nova.annotation.sub.nova.field.edit.Readonly;
import com.nova.annotation.sub.nova.field.edit.Search;

public @interface Edit {

    @Comment("名称")
    String title();

    @Comment("描述")
    String desc() default "";

    @Comment("是否必填")
    boolean notNull() default false;

    @Comment("是否显示")
    boolean show() default true;

    @Comment("表单提示信息")
    String placeHolder() default "";

    @Comment("查询项")
    Search search() default @Search(false);

    @Comment("是否只读")
    Readonly readonly() default @Readonly(add = false, edit = false);

    @Comment("组件类型")
    Type type() default Type.AUTO;

    @Comment("选择组件配置")
    ChoiceType choiceType() default @ChoiceType;

    @Comment("日期组件配置")
    DateType dateType() default @DateType;

    enum Type {

        @Comment("自动匹配")
        AUTO,

        @Comment("输入框")
        INPUT,

        @Comment("选择组件")
        CHOICE,

        @Comment("日期时间")
        DATE
    }

}
