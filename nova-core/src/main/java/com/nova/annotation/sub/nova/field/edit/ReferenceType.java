package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface ReferenceType {

    @Comment("当前对象存储对方对象的字段名，例如 user_id")
    String referenceField();

    @Comment("拉取对方引用数据时透传的当前对象上下文字段列表。对方 DataProxy.fetch 执行时，会携带当前对象前端表单上下文的实时属性值（sourceFields），用于扩展实现动态数据筛选")
    String[] referenceTransmitField() default {};

    @Comment("对方对象被当前对象引用的字段名，默认id，即当前对象的 referenceField 对应对方对象的哪个字段（通常为主键）")
    String storageField() default "id";

    @Comment("对方对象被当前对象引用场景下替代 storageField 展示的字段名，默认 name")
    String displayField() default "name";

    @Comment("tap页显示")
    boolean tapShow() default true;

    @Comment("动态tap页是否显示,使用此方式必须把show设置为true")
    ShowBy tapShowBy() default @ShowBy("");

}
