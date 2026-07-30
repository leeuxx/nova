package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface BooleanType {

    @Comment("类型")
    Type type() default Type.DEFAULT;

    @Comment("在表格中类型")
    Type tableType() default Type.DEFAULT;

    enum Type {
        @Comment("默认")
        DEFAULT,
        @Comment("开关")
        SWITCH
    }

}
