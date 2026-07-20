package com.nova.annotation.sub.nova;

import com.nova.annotation.config.Comment;

public @interface Drill {

    @Comment("标题")
    String title();

    @Comment("下钻目标配置")
    Link link();

    @interface Link {

        @Comment("当前类关联属性")
        String column();

        @Comment("目标类关联属性")
        String joinColumn();

        @Comment("关联类")
        Class<?> linkNova();

    }

}
