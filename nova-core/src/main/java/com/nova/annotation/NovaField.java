package com.nova.annotation;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.field.Edit;
import com.nova.annotation.sub.nova.field.View;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@Documented
public @interface NovaField {

    @Comment("表格列配置")
    View[] views() default {};

    @Comment("编辑组件配置")
    Edit edit() default @Edit(title = "");

    @Comment("显示顺序")
    int sort() default 1000;

}
