package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface LinkTargetType {

    @Comment("当前类存储引用类的关联属性名，例如 userId")
    String referenceField();

    @Comment("引用类值属性名，默认id，即当前类的 referenceField 对应引用类的哪个属性（通常为主键）")
    String storageField() default "id";

}
