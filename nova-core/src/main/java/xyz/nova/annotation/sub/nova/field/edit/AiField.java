package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.entity.data.NovaExpr;

public @interface AiField {

    @Comment("数据审查")
    Review review() default @Review(enable = false);

    @Comment("数据搜索")
    Search search() default @Search(enable = false);

    @interface Review {

        @Comment("是否启用")
        boolean enable() default true;

        @Comment("提示词")
        String prompt() default "检查值合理性";

    }

    @interface Search {

        @Comment("是否启用")
        boolean enable() default true;

        @Comment("可搜索的view列,为空表示全部")
        String[] views() default {};

        @Comment("允许的操作符,为空表示全部")
        NovaExpr.Op[] ops() default {};

    }

}
