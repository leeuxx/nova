package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface ChoiceType {

    @Comment("显示类型")
    ShowType showType() default ShowType.SELECT;

    @Comment("选择类型")
    SelectType selectType() default SelectType.SINGLE;

    @Comment("关联选择组件（用于级联选择）")
    String refChoice() default "";

    @Comment("静态选择列表")
    VL[] vl() default {};

    @Comment("动态选择列表")
    Class<? extends ChoiceFetchHandler> fetchHandler() default ChoiceFetchHandler.class;

    @Comment("可被fetchHandler接口获取到")
    String param() default "";

    @Comment("tap级搜索项（注：一个table页面只能有一个tap级搜索项！）")
    TapSearch tapSearch() default @TapSearch(showAll = false);

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
