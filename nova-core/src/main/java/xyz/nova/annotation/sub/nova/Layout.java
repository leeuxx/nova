package xyz.nova.annotation.sub.nova;

import xyz.nova.annotation.comment.Comment;

public @interface Layout {

    @Comment("编辑布局")
    EditLayout editLayout() default EditLayout.DEFAULT;

    @Comment("分页大小")
    int pageSize() default 10;

    @Comment("可选分页数")
    int[] pageSizes() default {10, 20, 30, 50, 100};

    enum EditLayout {

        @Comment("默认")
        DEFAULT,

        @Comment("整行")
        FULL_LINE
    }

}
