package com.nova.annotation;

import com.nova.annotation.config.Comment;
import com.nova.annotation.fun.DataProxy;
import com.nova.annotation.sub.nova.Layout;
import com.nova.annotation.sub.nova.row.RowOperation;

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

    @Comment("数据行为代理接口，对增、删、改、查等行为做逻辑处理")
    Class<? extends DataProxy<?>> dataProxy();

    @Comment("自定义功能按钮")
    RowOperation[] rowOperation() default {};

    @Comment("是否树结构")
    boolean tree() default false;

}
