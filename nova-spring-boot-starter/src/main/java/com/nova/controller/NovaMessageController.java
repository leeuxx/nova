package com.nova.controller;

import com.nova.annotation.NovaRouter;
import com.nova.annotation.config.Comment;
import com.nova.annotation.config.RestMappingController;
import com.nova.dto.NovaMessageClose;
import com.nova.entity.message.Message;
import com.nova.service.message.MessageProxy;
import com.nova.utils.AuthorityUtils;
import com.nova.utils.R;
import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@RestMappingController("nova/message")
public class NovaMessageController {

    private MessageProxy messageProxy;

    @Comment("获取消息列表")
    @PostMapping("getMessages")
    @NovaRouter
    public R<List<Message>> getMessages() {
        List<Message> messages = messageProxy.getMessages(AuthorityUtils.getToken());
        if (messages == null) {
            return R.ok(new ArrayList<>());
        }
        messages.forEach(message -> {
            message.setClose(message.getClose() == null || message.getClose());
            message.setType(message.getType() == null ? Message.Type.INFO : message.getType());
        });
        return R.ok(messages);
    }

    @Comment("关闭消息")
    @PostMapping("closeMessages")
    @NovaRouter
    public R<Object> closeMessages(@RequestBody @Validated NovaMessageClose messageClose) {
        messageProxy.close(AuthorityUtils.getToken(), messageClose.getIds());
        return R.ok(null);
    }

}
