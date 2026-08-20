package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import org.springframework.stereotype.Service;
import xyz.nova.entity.RoleMenu;
import xyz.nova.entity.data.Tree;
import xyz.nova.mapper.RoleMenuMapper;
import xyz.nova.nova.MenuNova;
import xyz.nova.nova.RoleMenuNova;
import xyz.nova.nova.RoleNova;
import xyz.nova.service.data.DataProxy;

import java.util.ArrayList;
import java.util.List;

@Service
public class RoleMenuServiceImpl extends ServiceImpl<RoleMenuMapper, RoleMenu> implements DataProxy<RoleMenuNova, Object> {

    @Override
    public void add(List<RoleMenuNova> roleMenuNova) {
        remove(new LambdaQueryWrapper<RoleMenu>()
                .eq(RoleMenu::getRoleId, roleMenuNova.get(0).getRoleNova().getId())
        );
        List<RoleMenu> roleMenus = new ArrayList<>(roleMenuNova.size());
        for (RoleMenuNova nova : roleMenuNova) {
            RoleNova roleNova = nova.getRoleNova();
            MenuNova menuNova = nova.getMenuNova();
            RoleMenu roleMenu = new RoleMenu()
                    .setId(YitIdHelper.nextId())
                    .setRoleId(roleNova.getId())
                    .setMenuId(menuNova.getId());
            roleMenus.add(roleMenu);
        }
        saveBatch(roleMenus);
    }

    @Override
    public List<Long> treeDisplay(Tree tree) {
        List<RoleMenu> roleMenus = list(new LambdaQueryWrapper<RoleMenu>()
                .eq(RoleMenu::getRoleId, tree.getOperateValue())
        );
        if (roleMenus == null || roleMenus.isEmpty()) {
            return new ArrayList<>();
        }
        return roleMenus.stream().map(RoleMenu::getMenuId).toList();
    }
}
