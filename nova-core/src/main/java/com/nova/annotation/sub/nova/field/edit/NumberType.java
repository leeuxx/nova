package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface NumberType {

    @Comment("数值类型")
    Type type() default Type.INTEGER;

    @Comment("最大值")
    long max() default Long.MAX_VALUE;

    @Comment("最小值")
    long min() default -Long.MAX_VALUE;

    @Comment("小数位数")
    int decimal() default 2;

    enum Type {
        @Comment("整型")
        INTEGER,
        @Comment("浮点型")
        DECIMAL
    }
}
