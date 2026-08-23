package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.nova.entity.UserRole;
import xyz.nova.error.NovaException;
import xyz.nova.mapper.UserRoleMapper;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class UserRoleServiceImpl extends ServiceImpl<UserRoleMapper, UserRole> {

    /**
     * 增加用户角色
     * @param userId 用户id
     * @param rolesIds 角色id
     */
    @Transactional(rollbackFor = Exception.class)
    public void addUserRole(long userId, List<Long> rolesIds) {
        remove(new LambdaQueryWrapper<UserRole>()
                .eq(UserRole::getUserId, userId)
        );
        if (!rolesIds.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            List<UserRole> userRoles = new ArrayList<>(rolesIds.size());
            rolesIds.forEach(rolesId -> {
                UserRole userRole = new UserRole()
                        .setId(YitIdHelper.nextId())
                        .setUserId(userId)
                        .setRoleId(rolesId)
                        .setCreateTime(now);
                userRoles.add(userRole);
            });
            saveBatch(userRoles);
        }
    }

    /**
     * 删除用户角色
     */
    public void deleteUserRole(List<Long> rolesIds) {
        List<UserRole> userRoles = list(new LambdaQueryWrapper<UserRole>()
                .in(UserRole::getRoleId, rolesIds)
        );
        if (!userRoles.isEmpty()) {
            List<Long> ids = userRoles.stream().map(UserRole::getId).toList();
            removeByIds(ids);
        }
    }

    /**
     * 登录
     */
    public List<Long> login(Long userId) {
        List<UserRole> userRoles = list(new LambdaQueryWrapper<UserRole>()
                .eq(UserRole::getUserId, userId)
        );
        if (userRoles == null || userRoles.isEmpty()) {
            throw new NovaException("用户无登录角色");
        }
        return userRoles.stream().map(UserRole::getRoleId).toList();
    }

}
