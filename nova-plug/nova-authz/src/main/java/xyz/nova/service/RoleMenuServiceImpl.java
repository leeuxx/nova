package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.nova.entity.Menu;
import xyz.nova.entity.Role;
import xyz.nova.entity.RoleMenu;
import xyz.nova.entity.data.Tree;
import xyz.nova.mapper.RoleMenuMapper;
import xyz.nova.nova.MenuNova;
import xyz.nova.nova.RoleMenuNova;
import xyz.nova.nova.RoleNova;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class RoleMenuServiceImpl extends ServiceImpl<RoleMenuMapper, RoleMenu> implements DataProxy<RoleMenuNova, Object> {

    private MenuServiceImpl menuService;

    private RoleServiceImpl roleService;

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
    public Tree.Vo<RoleMenuNova> tree(Tree tree) {
        Tree.Vo<RoleMenuNova> vo = new Tree.Vo<RoleMenuNova>()
                .setRootList(new ArrayList<>())
                .setChildrenList(new ArrayList<>());
        List<RoleMenu> roleMenus = list(new LambdaQueryWrapper<RoleMenu>()
                .eq(RoleMenu::getRoleId, tree.getOperateValue())
        );
        if (roleMenus != null && !roleMenus.isEmpty()) {
            Map<Long, RoleMenu> roleMenuMaps = roleMenus.stream().collect(Collectors.toMap(RoleMenu::getMenuId, Function.identity()));
            // 查询角色
            Role role = roleService.getById(tree.getOperateValue());
            RoleNova roleNova = BeanCopyUtils.copy(role, RoleNova.class);
            // 查询菜单
            List<Long> menuIds = roleMenus.stream().map(RoleMenu::getMenuId).toList();
            List<Menu> menus = menuService.listByIds(menuIds);
            // 使用 partitioningBy 只需遍历一次，性能更好
            Map<Boolean, List<Menu>> partitioned = menus.stream()
                    .collect(Collectors.partitioningBy(menu -> menu.getParentId() == null));
            List<Menu> rootList = partitioned.get(true);
            List<Menu> childrenList = partitioned.get(false);
            for (Menu menu : rootList) {
                RoleMenu roleMenuInfo = roleMenuMaps.get(menu.getId());
                RoleMenuNova roleMenuNova = new RoleMenuNova()
                        .setId(roleMenuInfo.getId())
                        .setRoleNova(roleNova)
                        .setMenuNova(BeanCopyUtils.copy(menu, MenuNova.class));
                vo.getRootList().add(roleMenuNova);
            }
            for (Menu menu : childrenList) {
                RoleMenu roleMenuInfo = roleMenuMaps.get(menu.getId());
                RoleMenuNova roleMenuNova = new RoleMenuNova()
                        .setId(roleMenuInfo.getId())
                        .setRoleNova(roleNova)
                        .setMenuNova(BeanCopyUtils.copy(menu, MenuNova.class));
                vo.getChildrenList().add(roleMenuNova);
            }
        }
        return vo;
    }
}
