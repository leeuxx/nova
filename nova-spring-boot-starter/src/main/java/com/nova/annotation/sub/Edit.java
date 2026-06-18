package com.nova.annotation.sub;

import com.nova.annotation.Comment;
import com.nova.annotation.sub.edit.*;

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
    EditType type() default EditType.AUTO;

    @Comment("选择组件配置")
    ChoiceType choiceType() default @ChoiceType;

    @Comment("日期组件配置")
    DateType dateType() default @DateType;
}
