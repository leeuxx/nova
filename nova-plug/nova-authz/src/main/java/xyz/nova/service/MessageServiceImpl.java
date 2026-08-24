package xyz.nova.service;

import cn.hutool.json.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.nova.authority.AuthorityProxyImpl;
import xyz.nova.entity.Message;
import xyz.nova.entity.User;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.mapper.MessageCloseMapper;
import xyz.nova.mapper.MessageMapper;
import xyz.nova.nova.MenuNova;
import xyz.nova.nova.MessageNova;
import xyz.nova.nova.UserNova;
import xyz.nova.nova.condition.MessageCondition;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.AuthorityUtils;
import xyz.nova.utils.BeanCopyUtils;
import xyz.nova.utils.NovaMyBatisUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class MessageServiceImpl extends ServiceImpl<MessageMapper, Message> implements DataProxy<MessageNova, MessageCondition> {

    private MessageCloseMapper messageCloseMapper;

    private UserServiceImpl userService;

    private AuthorityProxyImpl authorityProxy;

    @Override
    public void add(MessageNova messageNova) {
        Message message = BeanCopyUtils.copy(messageNova, Message.class)
                .setId(YitIdHelper.nextId())
                .setCreateTime(LocalDateTime.now());
        if (messageNova.getUserNova() != null) {
            message.setUserId(messageNova.getUserNova().getId());
        }
        save(message);
    }

    @Override
    public void delete(List<MessageNova> messageNova) {
        List<Long> ids = messageNova.stream().map(MessageNova::getId).toList();
        removeByIds(ids);
    }

    @Override
    public void update(MessageNova messageNova) {
        Message message = BeanCopyUtils.copy(messageNova, Message.class);
        updateById(message);
    }

    @Override
    public Fetch.Vo<MessageNova> fetch(Fetch<MessageCondition> fetch) {
        NovaMyBatisUtils.Result<Message> result = NovaMyBatisUtils.buildWrapper(MessageNova.class, fetch);
        IPage<Message> iPage = page(result.getPage(), result.getWrapper());
        List<Message> records = iPage.getRecords();
        Map<Long, User> userMap = new HashMap<>();
        if (!records.isEmpty()) {
            List<Long> userIds = records.stream()
                    .map(Message::getUserId)
                    .filter(Objects::nonNull)
                    .toList();
            if (!userIds.isEmpty()) {
                List<User> users = userService.listByIds(userIds);
                userMap = users.stream().collect(Collectors.toMap(User::getId, Function.identity()));
            }
        }
        List<MessageNova> messageNovas = new ArrayList<>();
        for (Message message : records) {
            MessageNova messageNova = BeanCopyUtils.copy(message, MessageNova.class);
            if (message.getUserId() != null) {
                User user = userMap.get(message.getUserId());
                messageNova.setUserNova(new UserNova()
                        .setId(user.getId())
                        .setName(user.getName())
                );
            }
            messageNovas.add(messageNova);
        }
        return new Fetch.Vo<MessageNova>()
                .setTotal(iPage.getTotal())
                .setRecords(messageNovas);
    }

    @Override
    public MessageNova details(Details details) {
        Message message = getById(details.getValue());
        MessageNova messageNova = BeanCopyUtils.copy(message, MessageNova.class);
        if (message.getUserId() != null) {
            User user = userService.getById(message.getUserId());
            messageNova.setUserNova(new UserNova()
                    .setId(user.getId())
                    .setName(user.getName())
            );
        }
        return messageNova;
    }

    public List<xyz.nova.entity.message.Message> getMessages() {
        JSONObject user = authorityProxy.getUser();
        List<Message> messages = list(new LambdaQueryWrapper<Message>()
                .eq(Message::getUserId, user.getLong("id"))
                .or()
                .isNull(Message::getUserId)
        );
        List<xyz.nova.entity.message.Message> result = new ArrayList<>();
        for (Message message : messages) {
            String type = message.getType();
            xyz.nova.entity.message.Message info = new xyz.nova.entity.message.Message()
                    .setId(String.valueOf(message.getId()))
                    .setContent(message.getContent())
                    .setTitle(message.getTitle())
                    .setType(
                            type.equals("INFO") ? xyz.nova.entity.message.Message.Type.INFO
                                    : type.equals("FOLLOW") ? xyz.nova.entity.message.Message.Type.FOLLOW
                                    : type.equals("CRITICAL") ? xyz.nova.entity.message.Message.Type.CRITICAL
                                    : null
                    )
                    .setClose(message.getAllowClose());
            result.add(info);
        }
        return result;
    }

}
