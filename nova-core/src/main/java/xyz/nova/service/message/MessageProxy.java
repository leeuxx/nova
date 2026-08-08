package xyz.nova.service.message;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.entity.message.Message;

import java.util.List;

public interface MessageProxy {

    @Comment("获取消息列表")
    List<Message> getMessages(String token);

    @Comment("关闭消息")
    void closeMessages(String token, List<String> ids);
}
