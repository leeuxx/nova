package xyz.nova.service;

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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MenuServiceImpl extends ServiceImpl<MenuMapper, Menu> implements DataProxy<MenuNova, Object> {

    @Override
    public void add(MenuNova menuNova) {
        MenuNova parent = menuNova.getMenuNova();
        long id = YitIdHelper.nextId();
        Menu menu = new Menu()
                .setId(YitIdHelper.nextId())
                .setParentId(parent != null ? parent.getId() : null)
                .setName(menuNova.getName())
                .setCode(Long.toString(id, 36).toUpperCase())
                .setIcon(menuNova.getIcon())
                .setSort(menuNova.getSort() == null ? 0 : menuNova.getSort())
                .setStatus(menuNova.getStatus())
                .setType(menuNova.getType())
                .setValue(menuNova.getValue())
                .setParam(menuNova.getParam())
                .setCreateTime(LocalDateTime.now());
        save(menu);
    }

    @Override
    public void delete(List<MenuNova> menuNova) {

    }

    @Override
    public void update(MenuNova menuNova) {
        DataProxy.super.update(menuNova);
    }

    @Override
    public MenuNova details(Details details) {
        return DataProxy.super.details(details);
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
                .map(menu -> {
                    MenuNova menuNova = new MenuNova();
                    BeanUtils.copyProperties(menu, menuNova);  // 属性拷贝，忽略不匹配的字段
                    return menuNova;
                })
                .collect(Collectors.toList());
        // 将子菜单列表转换为 MenuNova 对象列表
        List<MenuNova> childrenList = partitioned.get(false).stream()
                .map(menu -> {
                    MenuNova menuNova = new MenuNova();
                    BeanUtils.copyProperties(menu, menuNova);  // 属性拷贝
                    menuNova.setMenuNova(new MenuNova().setId(menu.getParentId()));
                    return menuNova;
                })
                .collect(Collectors.toList());
        // 封装返回结果
        return new Tree.Vo<MenuNova>()
                .setRootList(rootList)
                .setChildrenList(childrenList);
    }
}
