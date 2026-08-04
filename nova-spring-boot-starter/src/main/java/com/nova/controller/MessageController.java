package com.nova.controller;

import com.nova.annotation.config.Comment;
import com.nova.annotation.config.RestMappingController;
import com.nova.entity.message.Message;
import com.nova.service.message.MessageProxy;
import com.nova.utils.AuthorityUtils;
import com.nova.utils.R;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@AllArgsConstructor
@RestMappingController("nova/message")
public class MessageController {

    private MessageProxy messageProxy;

    @Comment("获取消息列表")
    @PostMapping("getMessages")
    public R<List<Message>> getMessages() {
        List<Message> messages = messageProxy.getMessages(AuthorityUtils.getToken());
        return R.ok(messages);
    }

}
