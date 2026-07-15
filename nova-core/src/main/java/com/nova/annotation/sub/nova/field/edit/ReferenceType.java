package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface ReferenceType {

    @Comment("当前类存储引用类的关联属性名，例如 userId")
    String referenceField();

    @Comment("引用类值属性名，默认id，即当前类的 referenceField 对应引用类的哪个属性（通常为主键）")
    String storageField() default "id";

    @Comment("引用类显示属性名，替代 storageField 展示，默认 name")
    String displayField() default "name";

    @Comment("当前类获取引用类数据时（弹窗选取 or 下拉选取），额外向引用类 DataProxy.fetch 传递的当前类表单上下文信息，用于动态筛选")
    String[] referenceTransmitField() default {};

    @Comment("tap页显示")
    boolean tapShow() default false;

    @Comment("tap页是否显示动态判断,使用此方式必须把show设置为true")
    ShowBy tapShowBy() default @ShowBy("");

}
