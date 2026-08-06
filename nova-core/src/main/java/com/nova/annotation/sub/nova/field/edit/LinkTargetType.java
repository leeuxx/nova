package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface LinkTargetType {

    @Comment("引用类型")
    Type type() default Type.OPERATE;

    @Comment("当前类关联字段")
    String ref();

    @Comment("目标类匹配字段")
    String by() default "id";

    @Comment("目标类展示字段")
    String byName() default "name";

    enum Type {
        @Comment("操作类")
        OPERATE,
        @Comment("选取类")
        SELECT
    }
}
