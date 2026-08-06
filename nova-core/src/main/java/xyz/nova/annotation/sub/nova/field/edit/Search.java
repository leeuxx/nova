package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.config.Comment;

public @interface Search {

    @Comment("是否搜索项")
    boolean value() default true;

    @Comment("高级查询")
    boolean vague() default false;

    @Comment("显示顺序,正序")
    int sort() default 0;

    @Comment("可被searchHandler接口获取到")
    String[] searchHandlerParams() default {};

    @Comment("动态是否搜索项,使用此方式必须把value设置为true")
    Class<? extends SearchHandler>[] searchHandler() default {};

}
