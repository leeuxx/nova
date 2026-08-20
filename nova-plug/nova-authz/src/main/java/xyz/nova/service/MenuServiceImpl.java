package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import xyz.nova.entity.Menu;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Tree;
import xyz.nova.mapper.MenuMapper;
import xyz.nova.nova.MenuNova;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MenuServiceImpl extends ServiceImpl<MenuMapper, Menu> implements DataProxy<MenuNova, Object> {

    @Override
    public void add(MenuNova menuNova) {
        MenuNova parent = menuNova.getMenuNova();
        long id = YitIdHelper.nextId();
        Menu menu = BeanCopyUtils.copy(menuNova, Menu.class)
                .setId(id)
                .setParentId(parent != null ? parent.getId() : null)
                .setCode(Long.toString(id, 36).toUpperCase())
                .setSort(menuNova.getSort() == null ? 0 : menuNova.getSort())
                .setCreateTime(LocalDateTime.now());
        save(menu);
    }

    @Override
    public void delete(List<MenuNova> menuNova) {
        List<Long> ids = menuNova.stream().map(MenuNova::getId).toList();
        cascadeDelete(ids);
    }

    @Override
    public void update(MenuNova menuNova) {
        Menu menu = BeanCopyUtils.copy(menuNova, Menu.class);
        if (menuNova.getMenuNova() != null) {
            menu.setParentId(menuNova.getMenuNova().getId());
        }
        updateById(menu);
    }

    @Override
    public MenuNova details(Details details) {
        Menu menu = getById(details.getValue());
        MenuNova menuNova = BeanCopyUtils.copy(menu, MenuNova.class);
        if (menu.getParentId() != null) {
            Menu parentMenu = getById(menu.getParentId());
            menuNova.setMenuNova(new MenuNova()
                    .setId(parentMenu.getId())
                    .setName(parentMenu.getName())
            );
        }
        return menuNova;
    }

    @Override
    public Tree.Vo<MenuNova> tree(Tree tree) {
        // 查询所有菜单数据
        List<Menu> menus = list(new LambdaUpdateWrapper<Menu>()
                .orderByAsc(Menu::getSort, Menu::getCreateTime)
        );
        // 使用 partitioningBy 只需遍历一次，性能更好
        Map<Boolean, List<Menu>> partitioned = menus.stream()
                .collect(Collectors.partitioningBy(menu -> menu.getParentId() == null));
        // 将根菜单列表转换为 MenuNova 对象列表
        List<MenuNova> rootList = partitioned.get(true).stream()
                .map(menu -> BeanCopyUtils.copy(menu, MenuNova.class))
                .collect(Collectors.toList());
        // 将子菜单列表转换为 MenuNova 对象列表
        List<MenuNova> childrenList = partitioned.get(false).stream()
                .map(menu -> BeanCopyUtils.copy(menu, MenuNova.class)
                        .setMenuNova(new MenuNova().setId(menu.getParentId()))
                )
                .collect(Collectors.toList());
        // 封装返回结果
        return new Tree.Vo<MenuNova>()
                .setRootList(rootList)
                .setChildrenList(childrenList);
    }

    /**
     * 递归删除菜单
     * @param ids 菜单id
     */
    private void cascadeDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        // 删除当前菜单
        removeBatchByIds(ids);
        // 查询下级菜单
        List<Menu> menus = list(new LambdaQueryWrapper<Menu>()
                .select(Menu::getId)
                .in(Menu::getParentId, ids)
        );
        // 递归删除下级菜单
        if (menus != null && !menus.isEmpty()) {
            List<Long> childIds = menus.stream()
                    .map(Menu::getId)
                    .toList();
            cascadeDelete(childIds);
        }
    }
}
