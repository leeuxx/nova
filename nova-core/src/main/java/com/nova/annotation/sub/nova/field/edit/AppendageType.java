package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.row.ExprBool;

public @interface AppendageType {

    @Comment("附属类存储当前类的关联属性名，例如 userId")
    String referenceField();

    @Comment("当前类属性名，默认id，即附属类的 referenceField 对应当前类的哪个属性（通常为主键）")
    String storageField() default "id";

    @Comment("附属类显示属性名，替代 storageField 展示，默认 name")
    String displayField() default "name";

    @Comment("tap页显示")
    boolean tapShow() default true;

    @Comment("是否支持双表视图（Edit.Type.APPENDAGE组件不支持双表视图）")
    boolean dualTable() default true;

    @Comment("tap页是否显示动态判断,使用此方式必须把tapShow设置为true（前端控制,根据某些属性动态显示tap页）")
    ShowBy tapShowBy() default @ShowBy("");

    @Comment("控制tap页和双表视图的显示与隐藏,使用此方式必须把tapShow和dualTable设置为true（后端控制,多用于访问权限）")
    ExprBool show() default @ExprBool;

}
