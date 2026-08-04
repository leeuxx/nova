package com.nova.service.message;

import com.nova.entity.message.Message;
import com.nova.service.message.MessageProxy;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnMissingBean(value = MessageProxy.class, ignored = DefaultMessageProxy.class)
public class DefaultMessageProxy implements MessageProxy {

    @Override
    public List<Message> getMessages(String token) {
        return new ArrayList<>();
    }

    @Override
    public void closeMessages(String token, List<String> ids) {

    }
}
