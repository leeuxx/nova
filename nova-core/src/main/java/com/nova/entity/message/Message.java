package com.nova.entity.message;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class Message {

    @Comment("id,必填")
    private String id;

    @Comment("内容,必填")
    private String content;

    @Comment("标题")
    private String title;

    @Comment("类型,默认INFO")
    private Type type;

    @Comment("允许关闭,默认true")
    private Boolean close;

    public enum Type {
        @Comment("普通")
        INFO,
        @Comment("关注")
        FOLLOW,
        @Comment("重要")
        CRITICAL
    }
}
