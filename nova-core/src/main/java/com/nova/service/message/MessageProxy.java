package com.nova.service.message;

import com.nova.annotation.config.Comment;
import com.nova.entity.message.Message;

import java.util.List;

public interface MessageProxy {

    @Comment("获取消息列表")
    List<Message> getMessages(String token);

    @Comment("关闭消息")
    void close(String token, List<String> ids);
}
