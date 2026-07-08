package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface LinkTargetType {

    @Comment("引用类型")
    Type type() default Type.OPERATE;

    @Comment("当前类存储引用类的关联属性名，例如 userId")
    String referenceField();

    @Comment("引用类值属性名，默认id，即当前类的 referenceField 对应引用类的哪个属性（通常为主键）")
    String storageField() default "id";

    @Comment("引用类显示属性名，替代 storageField 展示，默认 name")
    String displayField() default "name";

    enum Type {
        @Comment("操作类")
        OPERATE,
        @Comment("选取类")
        SELECT
    }
}
