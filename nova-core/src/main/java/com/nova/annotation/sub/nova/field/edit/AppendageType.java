package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;

public @interface AppendageType {

    @Comment("附属类存储当前类的关联属性名，例如 userId")
    String referenceField();

    @Comment("当前类属性名，默认id，即附属类的 referenceField 对应当前类的哪个属性（通常为主键）")
    String storageField() default "id";

    @Comment("附属类显示属性名，替代 storageField 展示，默认 name")
    String displayField() default "name";

    @Comment("tap页显示")
    boolean tapShow() default true;

    @Comment("tap页是否显示动态判断,使用此方式必须把show设置为true")
    ShowBy tapShowBy() default @ShowBy("");

}
