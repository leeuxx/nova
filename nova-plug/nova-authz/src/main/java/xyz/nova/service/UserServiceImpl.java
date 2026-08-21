package xyz.nova.service;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.nova.annotation.sub.nova.row.OperationHandler;
import xyz.nova.entity.Org;
import xyz.nova.entity.User;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.error.NovaException;
import xyz.nova.mapper.UserMapper;
import xyz.nova.nova.OrgNova;
import xyz.nova.nova.UserNova;
import xyz.nova.nova.condition.UserCondition;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;
import xyz.nova.utils.NovaMyBatisUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements DataProxy<UserNova, UserCondition>, OperationHandler<Long, Object> {

    private OrgServiceImpl orgService;

    @Override
    public void add(UserNova userNova) {
        long count = count(new LambdaQueryWrapper<User>()
                .eq(User::getAccount, userNova.getAccount())
        );
        if (count > 0) {
            throw new NovaException("账户已存在");
        }
        String salt = BCrypt.gensalt();
        String password = BCrypt.hashpw(userNova.getPassword(), salt);
        User user = BeanCopyUtils.copy(userNova, User.class)
                .setId(YitIdHelper.nextId())
                .setCreateTime(LocalDateTime.now())
                .setSalt(salt)
                .setPassword(password);
        if (userNova.getOrgNova() != null) {
            user.setOrgId(userNova.getOrgNova().getId());
        }
        save(user);
    }

    @Override
    public void delete(List<UserNova> userNova) {
        DataProxy.super.delete(userNova);
    }

    @Override
    public void update(UserNova userNova) {
        userNova.setAccount(null).setPassword(null);
        User user = BeanCopyUtils.copy(userNova, User.class);
        if (userNova.getOrgNova() != null) {
            user.setOrgId(userNova.getOrgNova().getId());
        }
        updateById(user);
    }

    @Override
    public Fetch.Vo<UserNova> fetch(Fetch<UserCondition> fetch) {
        NovaMyBatisUtils.Result<User> result = NovaMyBatisUtils.buildWrapper(UserNova.class, fetch);
        IPage<User> iPage = page(result.getPage(), result.getWrapper());
        List<User> records = iPage.getRecords();
        List<UserNova> userNovas = new ArrayList<>();
        Map<Long, Org> orgMap = Collections.emptyMap();
        if (!records.isEmpty()) {
            // 查询组织结构
            List<Long> orgIds = records.stream()
                    .map(User::getOrgId)
                    .filter(Objects::nonNull)
                    .toList();
            if (!orgIds.isEmpty()) {
                List<Org> orgs = orgService.listByIds(orgIds);
                if (!orgs.isEmpty()) {
                    orgMap = orgs.stream().collect(Collectors.toMap(Org::getId, Function.identity()));
                }
            }
        }
        for (User record : records) {
            UserNova userNova = BeanCopyUtils.copy(record, UserNova.class)
                    .setPassword(null);
            if (record.getOrgId() != null) {
                Org org = orgMap.get(record.getOrgId());
                if (org != null) {
                    userNova.setOrgNova(new OrgNova()
                            .setId(org.getId())
                            .setName(org.getName())
                    );
                }
            }
            userNovas.add(userNova);
        }
        return new Fetch.Vo<UserNova>()
                .setTotal(iPage.getTotal())
                .setRecords(userNovas);
    }

    @Override
    public UserNova details(Details details) {
        User user = getById(details.getValue());
        UserNova userNova = BeanCopyUtils.copy(user, UserNova.class)
                .setPassword("******");
        if (user.getOrgId() != null) {
            Org org = orgService.getById(user.getOrgId());
            if (org != null) {
                userNova.setOrgNova(new OrgNova()
                        .setId(org.getId())
                        .setName(org.getName())
                );
            }
        }
        return userNova;
    }

    /**
     * 根据组织清空用户组织
     */
    public void orgClear(List<Long> orgIds) {
        update(new LambdaUpdateWrapper<User>()
                .set(User::getOrgId, null)
                .in(User::getOrgId, orgIds)
        );
    }

    @Override
    public String exec(List<Long> novaIds, Object o, String param) {
        if (param.equals("user_reset_pwd")) {
            UserNova.UserResetPwdNova userResetPwdNova = (UserNova.UserResetPwdNova) o;
            if (!userResetPwdNova.getPassword().equals(userResetPwdNova.getConfirmPassword())) {
                throw new NovaException("两次输入的密码不一致");
            }
            String salt = BCrypt.gensalt();
            String password = BCrypt.hashpw(userResetPwdNova.getPassword(), salt);
            updateById(new User()
                    .setId(novaIds.get(0))
                    .setSalt(salt)
                    .setPassword(password)
            );
        }
        return null;
    }
}
