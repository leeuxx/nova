package com.nova.annotation.sub.nova.field;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.field.edit.*;

public @interface Edit {

    @Comment("名称")
    String title();

    @Comment("描述")
    String desc() default "";

    @Comment("是否必填")
    boolean notNull() default false;

    @Comment("是否显示")
    boolean show() default true;

    @Comment("搜索项")
    Search search() default @Search(false);

    @Comment("是否只读")
    Readonly readonly() default @Readonly;

    @Comment("组件类型")
    Type type() default Type.AUTO;

    @Comment("选择组件配置")
    ChoiceType choiceType() default @ChoiceType;

    @Comment("标签组件配置")
    TagType tagType() default @TagType;

    @Comment("日期组件配置")
    DateType dateType() default @DateType;

    @Comment("数值输入框配置")
    NumberType numberType() default @NumberType;

    @Comment("布尔值组件配置")
    BooleanType booleanType() default @BooleanType;

    @Comment("文件上传组件配置")
    AttachmentType attachmentType() default @AttachmentType;

    enum Type {

        @Comment("自动匹配")
        AUTO,

        @Comment("输入框")
        INPUT,

        @Comment("数值输入框")
        NUMBER,

        @Comment("多行文本")
        TEXTAREA,

        @Comment("选择组件")
        CHOICE,

        @Comment("标签组件")
        TAG,

        @Comment("日期时间")
        DATE,

        @Comment("布尔值")
        BOOLEAN,

        @Comment("文件上传组件")
        ATTACHMENT,


        @Comment("分割线")
        DIVIDE,

        @Comment("空占位")
        EMPTY
    }

}
