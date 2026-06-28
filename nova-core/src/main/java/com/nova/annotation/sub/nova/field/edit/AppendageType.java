package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface AppendageType {

    @Comment("对方对象存储当前对象的字段名，例如 user_id")
    String referenceField();

    @Comment("当前对象被引用的字段名，默认id，即对方对象的 referenceField 对应当前对象的哪个字段（通常为主键）")
    String storageField() default "id";

}
