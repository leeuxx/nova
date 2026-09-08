package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface TapSearch {

    @Comment("开关")
    boolean value() default true;

    @Comment("是否显示全部项tap")
    boolean showAll() default true;

}
