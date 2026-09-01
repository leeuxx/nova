package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.nova.annotation.sub.nova.field.edit.ChoiceFetchHandler;
import xyz.nova.entity.Role;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.error.NovaException;
import xyz.nova.i18n.NovaI18nUtils;
import xyz.nova.mapper.RoleMapper;
import xyz.nova.nova.RoleNova;
import xyz.nova.nova.condition.RoleCondition;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;
import xyz.nova.utils.NovaMyBatisUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class RoleServiceImpl extends ServiceImpl<RoleMapper, Role> implements DataProxy<RoleNova, RoleCondition>, ChoiceFetchHandler {

    private RoleMenuServiceImpl roleMenuService;

    private UserRoleServiceImpl userRoleService;

    @Override
    public void add(RoleNova roleNova) {
        long count = count(new LambdaQueryWrapper<Role>()
                .eq(Role::getCode, roleNova.getCode())
        );
        if (count > 0) {
            throw new NovaException(NovaI18nUtils.get("work.dataExist", new Object[]{"code"}));
        }
        Role role = BeanCopyUtils.copy(roleNova, Role.class)
                .setId(YitIdHelper.nextId())
                .setCreateTime(LocalDateTime.now());
        save(role);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(List<RoleNova> roleNova) {
        List<Long> ids = roleNova.stream().map(RoleNova::getId).toList();
        // 删除角色菜单权限
        roleMenuService.roleDelete(ids);
        // 删除用户角色授权
        userRoleService.deleteUserRole(ids);
        // 删除角色
        removeBatchByIds(ids);
    }

    @Override
    public void update(RoleNova roleNova) {
        long count = count(new LambdaQueryWrapper<Role>()
                .eq(Role::getCode, roleNova.getCode())
                .ne(Role::getId, roleNova.getId())
        );
        if (count > 0) {
            throw new NovaException(NovaI18nUtils.get("work.dataExist", new Object[]{"code"}));
        }
        Role role = BeanCopyUtils.copy(roleNova, Role.class);
        updateById(role);
    }

    @Override
    public Fetch.Vo<RoleNova> fetch(Fetch<RoleCondition> fetch) {
        NovaMyBatisUtils.Result<Role> buildWrapper = NovaMyBatisUtils.buildWrapper(RoleNova.class, fetch);
        IPage<Role> iPage = page(buildWrapper.getPage(), buildWrapper.getWrapper());
        List<Role> records = iPage.getRecords();
        List<RoleNova> roleNovas = BeanCopyUtils.<Role, RoleNova>copy(records, RoleNova.class);
        return new Fetch.Vo<RoleNova>()
                .setTotal(iPage.getTotal())
                .setRecords(roleNovas);
    }

    @Override
    public RoleNova details(Details details) {
        Role role = getById(details.getValue());
        return BeanCopyUtils.copy(role, RoleNova.class);
    }

    @Override
    public List<VLModel> fetchChoices(String param) {
        List<Role> roles = list(new LambdaQueryWrapper<Role>()
                .orderByAsc(Role::getCreateTime)
        );
        List<VLModel> vlModels = new ArrayList<>();
        roles.forEach(role -> {
            VLModel vlModel = new VLModel()
                    .setLabel(role.getName())
                    .setValue(String.valueOf(role.getId()));
            vlModels.add(vlModel);
        });
        return vlModels;
    }

    /**
     * 登录
     */
    public List<Long> login(List<Long> roleIds) {
        List<Role> roles = list(new LambdaQueryWrapper<Role>()
                .in(Role::getId, roleIds)
                .eq(Role::getStatus, true)
        );
        if (roles == null || roles.isEmpty()) {
            throw new NovaException(NovaI18nUtils.get("permission.noneRole"));
        }
        return roles.stream().map(Role::getId).toList();
    }

}
