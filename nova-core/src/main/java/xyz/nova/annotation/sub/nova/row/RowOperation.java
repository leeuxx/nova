package xyz.nova.annotation.sub.nova.row;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.service.DefaultOperationHandler;

public @interface RowOperation {

    @Comment("标题")
    String title();

    @Comment("功能提示")
    String tip() default "";

    @Comment("调用提示,空则不提示")
    String callHint() default "";

    @Comment("操作列按钮且不折叠时文字的颜色")
    String color() default "";

    @Comment("图标")
    String icon() default "";

    @Comment("功能模式")
    Mode mode() default Mode.MULTI;

    @Comment("功能类型")
    Type type() default Type.NOVA;

    @Comment("分组名,折叠时把同分组按钮进行二级菜单归类")
    String group() default "";

    @Comment("操作列按钮控制可用与禁用（前端,每行数据一次）")
    String ifExpr() default "";

    @Comment("控制按钮显示与隐藏（后端,仅该按钮一次）")
    ExprBool show() default @ExprBool;

    @Comment("该配置可在operationHandler和tpl模版中获取")
    String param() default "";

    @Comment("type=NOVA时可用,引用一个Nova类做为参数表单,按钮提交附带该表单参数")
    Class<?> novaClass() default void.class;

    @Comment("type=NOVA时可用,操作按钮点击后台处理类")
    Class<? extends OperationHandler> operationHandler() default DefaultOperationHandler.class;

    @Comment("type=TPL时可用,自定义模板配置")
    Tpl tpl() default @Tpl(path = "");

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

    @interface Tpl {

        @Comment("模板文件路径; 打开时会拼参数：?token=x&novaName=x&novaIds=x&param=x")
        @Comment("1. 支持相对路径（基于public目录，如public/tpl/test.html 填 tpl/test.html）")
        @Comment("2. 支持远程url")
        String path();

        @Comment("弹出层宽度%（对话框有效，抽屉左、右有效）")
        String width() default "";

        @Comment("弹出层高度%（对话框有效，抽屉上、下有效）")
        String height() default "";

        @Comment("弹出层打开方式")
        OpenWay openWay() default OpenWay.MODAL;

        @Comment("抽屉打开方向")
        Placement drawerPlacement() default Placement.RIGHT;

        enum OpenWay {
            @Comment("对话框")
            MODAL,
            @Comment("抽屉")
            DRAWER
        }

        enum Placement {
            @Comment("上")
            TOP,
            @Comment("下")
            BOTTOM,
            @Comment("左")
            LEFT,
            @Comment("右")
            RIGHT
        }

    }

}
