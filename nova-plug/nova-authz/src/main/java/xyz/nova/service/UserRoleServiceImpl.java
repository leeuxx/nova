package xyz.nova.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.nova.entity.Role;
import xyz.nova.entity.User;
import xyz.nova.entity.UserRole;
import xyz.nova.entity.data.Fetch;
import xyz.nova.mapper.UserRoleMapper;
import xyz.nova.nova.RoleNova;
import xyz.nova.nova.UserNova;
import xyz.nova.nova.UserRoleNova;
import xyz.nova.nova.condition.UserRoleCondition;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.NovaMyBatisUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserRoleServiceImpl extends ServiceImpl<UserRoleMapper, UserRole> implements DataProxy<UserRoleNova, UserRoleCondition> {

    private UserServiceImpl userService;

    private RoleServiceImpl roleService;

    @Override
    public void add(List<UserRoleNova> userRoleNova) {
        LocalDateTime now = LocalDateTime.now();
        List<UserRole> userRoles = new ArrayList<>(userRoleNova.size());
        for (UserRoleNova nova : userRoleNova) {
            UserRole userRole = new UserRole()
                    .setId(YitIdHelper.nextId())
                    .setUserId(nova.getUserNova().getId())
                    .setRoleId(nova.getRoleNova().getId())
                    .setCreateTime(now);
            userRoles.add(userRole);
        }
        saveBatch(userRoles);
    }

    @Override
    public void delete(List<UserRoleNova> userRoleNova) {
        DataProxy.super.delete(userRoleNova);
    }

    @Override
    public Fetch.Vo<UserRoleNova> fetch(Fetch<UserRoleCondition> fetch) {
        NovaMyBatisUtils.Result<UserRole> result = NovaMyBatisUtils.buildWrapper(UserRoleNova.class, fetch);
        IPage<UserRole> iPage = page(result.getPage(), result.getWrapper());
        List<UserRole> records = iPage.getRecords();
        UserRoleCondition condition = fetch.getCondition();
        User user = userService.getById(condition.getUserId());
        UserNova userNova = new UserNova().setId(user.getId())
                .setName(user.getName());
        Map<Long, Role> roleMap = new HashMap<>();
        if (!records.isEmpty()) {
            List<Long> roleIds = records.stream().map(UserRole::getRoleId).toList();
            List<Role> roles = roleService.listByIds(roleIds);
            roleMap = roles.stream().collect(Collectors.toMap(Role::getId, Function.identity()));
        }
        List<UserRoleNova> userRoleNovas = new ArrayList<>();
        for (UserRole record : records) {
            Role role = roleMap.get(record.getRoleId());
            UserRoleNova userRoleNova = new UserRoleNova()
                    .setId(record.getId())
                    .setCreateTime(record.getCreateTime())
                    .setUserNova(userNova)
                    .setRoleNova(new RoleNova()
                            .setId(role.getId())
                            .setName(role.getName())
                            .setCode(role.getCode())
                            .setStatus(role.getStatus())
                    );
            userRoleNovas.add(userRoleNova);
        }
        return new Fetch.Vo<UserRoleNova>()
                .setTotal(iPage.getTotal())
                .setRecords(userRoleNovas);
    }
}
