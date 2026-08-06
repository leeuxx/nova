package com.nova.annotation.sub.nova.field.edit;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.row.ExprBool;

public @interface ReferenceType {

    @Comment("当前类关联字段")
    String ref();

    @Comment("目标类匹配字段")
    String by() default "id";

    @Comment("目标类展示字段")
    String byName() default "name";

    @Comment("当前类获取目标类数据时（弹窗选取 or 下拉选取）,额外传递的当前类表单上下文信息，用于动态筛选")
    String[] context() default {};

    @Comment("tap页显示")
    boolean tapShow() default false;

    @Comment("tap页是否显示动态判断,使用此方式必须把tapShow设置为true（前端控制,根据某些属性动态显示tap页）")
    ShowBy tapShowBy() default @ShowBy("");

    @Comment("控制tap页显示与隐藏,使用此方式必须把tapShow设置为true（后端控制,多用于访问权限）")
    ExprBool show() default @ExprBool;

}
