package com.nova.entity.message;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class Message {

    @Comment("内容,必填")
    private String content;

    @Comment("标题")
    private String title;

    @Comment("允许关闭")
    private Boolean close;

}
