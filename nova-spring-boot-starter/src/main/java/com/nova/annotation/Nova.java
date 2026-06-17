package com.nova.annotation;

import com.nova.annotation.sub.Layout;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
public @interface Nova {

    @Comment("功能名称")
    String name();

    @Comment("功能描述")
    String desc() default "";

    @Comment("排序表达式")
    String orderBy() default "";

    @Comment("功能布局")
    Layout layout() default @Layout;

}
