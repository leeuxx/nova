package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import org.springframework.stereotype.Service;
import xyz.nova.entity.Role;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Fetch;
import xyz.nova.error.NovaException;
import xyz.nova.mapper.RoleMapper;
import xyz.nova.nova.RoleNova;
import xyz.nova.nova.condition.RoleCondition;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;
import xyz.nova.utils.NovaMyBatisUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RoleServiceImpl extends ServiceImpl<RoleMapper, Role> implements DataProxy<RoleNova, RoleCondition> {

    @Override
    public void add(RoleNova roleNova) {
        long count = count(new LambdaQueryWrapper<Role>()
                .eq(Role::getCode, roleNova.getCode())
        );
        if (count > 0) {
            throw new NovaException("code已存在");
        }
        Role role = BeanCopyUtils.copy(roleNova, Role.class)
                .setId(YitIdHelper.nextId())
                .setCreateTime(LocalDateTime.now());
        save(role);
    }

    @Override
    public void delete(List<RoleNova> roleNova) {
        List<Long> ids = roleNova.stream().map(RoleNova::getId).toList();
        removeBatchByIds(ids);
    }

    @Override
    public void update(RoleNova roleNova) {
        long count = count(new LambdaQueryWrapper<Role>()
                .eq(Role::getCode, roleNova.getCode())
                .ne(Role::getId, roleNova.getId())
        );
        if (count > 0) {
            throw new NovaException("code已存在");
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
                .setTotal(roleNovas.size())
                .setRecords(roleNovas);
    }

    @Override
    public RoleNova details(Details details) {
        Role role = getById(details.getValue());
        return BeanCopyUtils.copy(role, RoleNova.class);
    }
}
