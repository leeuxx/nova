package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface ReferenceType {

    @Comment("关联类型")
    Type type() default Type.MANY_TO_ONE;

    @Comment("关联字段,多表存储一表的属性名")
    String referenceField();

    @Comment("关联引用透传属性,一表DataProxy.fetch执行时,会带上多表前端表单上下文的实时属性进行请求,属性名：sourceFields,用于扩展实现动态的数据筛选")
    String[] referenceTransmitField() default {};

    @Comment("存储列,一表被多表引用的属性名")
    String storageField() default "id";

    @Comment("展示列,一表展示到多表中的属性名")
    String displayField() default "name";

    enum Type {
        @Comment("多对一")
        MANY_TO_ONE
    }
}
