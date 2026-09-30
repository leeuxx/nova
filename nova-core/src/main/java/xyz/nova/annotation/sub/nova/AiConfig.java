package xyz.nova.annotation.sub.nova;

import xyz.nova.annotation.comment.Comment;

public @interface AiConfig {

    @Comment("模型配置名称，对应yaml中的openAis（默认第一个）")
    String name() default "";

}
