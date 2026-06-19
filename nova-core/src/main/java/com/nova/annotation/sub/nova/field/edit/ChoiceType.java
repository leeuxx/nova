package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface ChoiceType {

    @Comment("显示类型")
    ShowType showType() default ShowType.SELECT;

    @Comment("选择类型")
    SelectType selectType() default SelectType.SINGLE;

    @Comment("静态选择列表")
    VL[] vl() default {};

    @Comment("动态选择列表")
    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {};

    @Comment("可被fetchHandler接口获取到")
    String[] fetchHandlerParams() default {};

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
