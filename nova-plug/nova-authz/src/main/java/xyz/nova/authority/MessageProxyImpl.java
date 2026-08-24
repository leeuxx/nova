package xyz.nova.authority;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.nova.entity.message.Message;
import xyz.nova.service.MessageServiceImpl;
import xyz.nova.service.message.MessageProxy;

import java.util.List;

@Service
@AllArgsConstructor
public class MessageProxyImpl implements MessageProxy {

    private MessageServiceImpl messageService;

    @Override
    public List<Message> getMessages(String token) {
        return messageService.getMessages();
    }

    @Override
    public void closeMessages(String token, List<String> ids) {

    }
}
