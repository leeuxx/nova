package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface TagType {

    @Comment("是否允许自定义标签")
    boolean allowExtension() default true;

    @Comment("最大标签数")
    int maxTagCount() default 9999;

    @Comment("静态标签列表")
    String[] tags() default {};

    @Comment("可从fetchHandler中获取")
    String[] fetchHandlerParams() default {};

    @Comment("动态标签列表")
    Class<? extends TagFetchHandler>[] fetchHandler() default {};

}
