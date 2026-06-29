package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface AppendageType {

    @Comment("对方对象存储当前对象的字段名，例如 user_id")
    String referenceField();

    @Comment("当前对象被对方对象引用的字段名，默认id，即对方对象的 referenceField 对应当前对象的哪个字段（通常为主键）")
    String storageField() default "id";

    @Comment("对方对象在被引用显示场景下展示的字段名，默认 name")
    String displayField() default "name";

    @Comment("tap页显示")
    boolean tapShow() default true;

    @Comment("动态tap页是否显示,使用此方式必须把show设置为true")
    ShowBy tapShowBy() default @ShowBy("");

}
