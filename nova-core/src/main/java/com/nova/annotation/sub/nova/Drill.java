package com.nova.annotation.sub.nova;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.row.ExprBool;

public @interface Drill {

    @Comment("标题")
    String title();

    @Comment("下钻目标配置")
    Link link();

    @Comment("是否显示")
    boolean show() default true;

    @Comment("控制显示与隐藏,使用此方式必须把show设置为true（后端控制,多用于访问权限）")
    ExprBool showBy() default @ExprBool;

    @interface Link {

        @Comment("关联类")
        Class<?> linkNova();

        @Comment("当前类关联属性（支持 属性名 和 对象.属性名，如：id 和 obj.id）")
        String column();

        @Comment("目标类关联属性（支持 属性名 和 对象.属性名，如：id 和 obj.id）")
        String joinColumn();

    }

}
