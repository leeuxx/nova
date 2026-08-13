package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;

public @interface Readonly {

    @Comment("新增只读")
    boolean add() default false;

    @Comment("修改只读")
    boolean edit() default false;

    @Comment("可被exprHandler接口获取到")
    String param() default "";

    @Comment("动态只读控制实现，优先级高于静态配置")
    Class<? extends ReadonlyHandler> exprHandler() default ReadonlyHandler.class;

    interface ReadonlyHandler {

        @Comment("新增只读")
        boolean add(String param);

        @Comment("修改只读")
        boolean edit(String param);

    }

}