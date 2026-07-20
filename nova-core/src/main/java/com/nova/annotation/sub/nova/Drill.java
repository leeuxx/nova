package com.nova.annotation.sub.nova;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.row.ExprBool;

public @interface Drill {

    @Comment("标题")
    String title();

    @Comment("下钻目标配置")
    Link link();

    @Comment("控制显示与隐藏（后端控制,多用于访问权限）")
    ExprBool show() default @ExprBool;

    @interface Link {

        @Comment("当前类关联属性（支持属性名和对象.属性名,如：id和obj.id）")
        String column();

        @Comment("目标类关联属性（支持属性名和对象.属性名,如：id和obj.id）")
        String joinColumn();

        @Comment("关联类")
        Class<?> linkNova();

    }

}
