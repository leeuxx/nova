package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface TapSearch {

    @Comment("开关")
    boolean value() default false;

    @Comment("是否显示全部项tap")
    boolean showAll() default true;

}
