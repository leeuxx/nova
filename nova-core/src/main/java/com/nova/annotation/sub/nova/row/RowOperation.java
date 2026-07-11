package com.nova.annotation.sub.nova.row;

import com.nova.annotation.config.Comment;

public @interface RowOperation {

    @Comment("标题")
    String title();

    @Comment("功能提示")
    String tip() default "";

    @Comment("调用提示,空则不提示")
    String callHint() default "";

    @Comment("标题颜色,单行且不折叠时有效")
    String color() default "";

    @Comment("图标")
    String icon() default "";

    @Comment("功能模式")
    Mode mode() default Mode.MULTI;

    @Comment("功能类型")
    Type type() default Type.NOVA;

    @Comment("行级按钮控制可用与禁用（前端,每行数据一次）")
    String ifExpr() default "";

    @Comment("所有按钮控制显示与隐藏（后端,仅该按钮一次）")
    ExprBool show() default @ExprBool;

    @Comment("按钮提交时，需要填写的表单信息")
    Class<?> novaClass() default void.class;

    @Comment("该配置可在operationHandler中获取")
    String operationParam() default "";

    @Comment("type为NOVA时可用，操作按钮点击后，后台处理逻辑")
    Class<? extends OperationHandler> operationHandler() default OperationHandler.class;

    enum Mode {
        @Comment("依赖单行数据")
        SINGLE,
        @Comment("依赖多行数据")
        MULTI,
        @Comment("仅依赖多行数据，屏蔽单行操作按钮")
        MULTI_ONLY,
        @Comment("不依赖行数据")
        BUTTON
    }

    enum Type {
        @Comment("通过nova表单渲染，operationHandler进行逻辑处理")
        NOVA,
        @Comment("通过自定义模板渲染")
        TPL
    }
}
