package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface ReferenceType {

    @Comment("关联类型")
    Type type() default Type.MANY_TO_ONE;

    @Comment("关联字段")
    String referenceField();

    @Comment("存储列")
    String storageField() default "id";

    @Comment("展示列")
    String displayField() default "name";

    enum Type {
        @Comment("多对一")
        MANY_TO_ONE
    }
}
