package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface Readonly {

    @Comment("新增只读")
    boolean add() default false;

    @Comment("修改只读")
    boolean edit() default false;

    @Comment("动态只读处理器")
    Class<? extends ReadonlyHandler> exprHandler() default ReadonlyHandler.class;

    @Comment("可被exprHandler接口获取到")
    String[] params() default {};

    interface ReadonlyHandler {

        @Comment("新增只读")
        boolean add(boolean add, String[] params);

        @Comment("修改只读")
        boolean edit(boolean edit, String[] params);

    }
}