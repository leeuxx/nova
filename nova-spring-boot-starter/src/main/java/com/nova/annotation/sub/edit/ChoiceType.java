package com.nova.annotation.sub.edit;

import com.nova.annotation.Comment;

public @interface ChoiceType {

    @Comment("显示类型")
    ShowType showType() default ShowType.SELECT;

    @Comment("选择类型")
    SelectType selectType() default SelectType.SINGLE;

    @Comment("静态选择列表")
    VL[] vl() default {};

    enum ShowType {
        @Comment("下拉列表")
        SELECT,
        @Comment("选择框")
        RADIO
    }

    enum SelectType {
        @Comment("单选")
        SINGLE,
        @Comment("多选")
        MULTI
    }
}
