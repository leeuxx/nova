package xyz.nova.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.yitter.idgen.YitIdHelper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.nova.annotation.sub.nova.row.OperationHandler;
import xyz.nova.entity.Menu;
import xyz.nova.entity.data.Details;
import xyz.nova.entity.data.Tree;
import xyz.nova.mapper.MenuMapper;
import xyz.nova.nova.MenuNova;
import xyz.nova.service.data.DataProxy;
import xyz.nova.utils.BeanCopyUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class MenuServiceImpl extends ServiceImpl<MenuMapper, Menu> implements DataProxy<MenuNova, Object>, OperationHandler<Long, Object> {

    private RoleMenuServiceImpl roleMenuService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(MenuNova menuNova) {
        MenuNova parent = menuNova.getMenuNova();
        long id = YitIdHelper.nextId();
        LocalDateTime now = LocalDateTime.now();
        Menu menu = BeanCopyUtils.copy(menuNova, Menu.class)
                .setId(id)
                .setParentId(parent != null ? parent.getId() : null)
                .setCode(Long.toString(id, 36).toUpperCase())
                .setSort(menuNova.getSort() == null ? 0 : menuNova.getSort())
                .setCreateTime(now);
        save(menu);
        // 系统按钮处理
        String sysButton = menuNova.getSysButton();
        if (sysButton != null && !sysButton.isEmpty()) {
            String[] split = sysButton.split(",");
            List<Menu> sysButtonMenus = new ArrayList<>();
            for (String s : split) {
                Menu sysButtonMenu = new Menu()
                        .setId(YitIdHelper.nextId())
                        .setParentId(id)
                        .setCode(menu.getCode() + "@" + s)
                        .setIcon(s.equals("ADD") ? "gridicons:add-outline" : s.equals("EDIT") ? "ep:edit" : s.equals("DELETE") ? "fluent:delete-48-regular" : null)
                        .setName(s.equals("ADD") ? "新增" : s.equals("EDIT") ? "编辑" : s.equals("DELETE") ? "删除" : null)
                        .setSort(menu.getSort())
                        .setStatus(true)
                        .setType("BUTTON")
                        .setCreateTime(now);
                sysButtonMenus.add(sysButtonMenu);
            }
            saveBatch(sysButtonMenus);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(List<MenuNova> menuNova) {
        List<Long> ids = menuNova.stream().map(MenuNova::getId).toList();
        // 删除所有角色菜单权限
        roleMenuService.menuDelete(ids);
        // 删除菜单
        cascadeDelete(ids);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(MenuNova menuNova) {
        Menu updateInfo = BeanCopyUtils.copy(menuNova, Menu.class);
        if (menuNova.getMenuNova() != null) {
            updateInfo.setParentId(menuNova.getMenuNova().getId());
        }
        updateById(updateInfo);
        // 系统按钮处理
        Menu menu = getById(updateInfo.getId());
        if (menu.getType().equals("NOVA")) {
            // 预定义的系统按钮编码后缀
            String[] buttonSuffixes = {"@ADD", "@EDIT", "@DELETE"};
            // 1. 查询数据库中已存在的系统按钮
            List<Menu> existSysButtons = list(new LambdaQueryWrapper<Menu>()
                    .eq(Menu::getParentId, menu.getId())
                    .in(Menu::getCode, menu.getCode() + "@ADD", menu.getCode() + "@EDIT", menu.getCode() + "@DELETE")
            );
            String sysButton = menuNova.getSysButton();
            if (sysButton == null || sysButton.isEmpty()) {
                // 2. sysButton为空：删除所有已存在的系统按钮
                List<MenuNova> menuNovas = BeanCopyUtils.<Menu, MenuNova>copy(existSysButtons, MenuNova.class);
                if (!menuNovas.isEmpty()) {
                    delete(menuNovas);
                }
            } else {
                // 3. sysButton不为空：计算差异并处理
                String[] split = sysButton.split(",");
                Set<String> targetButtonSet = new HashSet<>(Arrays.asList(split));
                // 已存在按钮的Code集合
                Set<String> existCodeSet = existSysButtons.stream()
                        .map(Menu::getCode)
                        .collect(Collectors.toSet());
                // 3.1 需要删除的按钮：数据库存在但目标中不存在
                List<Menu> toDelete = existSysButtons.stream()
                        .filter(menuItem -> !targetButtonSet.contains(
                                menuItem.getCode().replace(menu.getCode() + "@", "")
                        ))
                        .toList();
                if (!toDelete.isEmpty()) {
                    List<MenuNova> menuNovas = BeanCopyUtils.<Menu, MenuNova>copy(toDelete, MenuNova.class);
                    delete(menuNovas);
                }
                // 3.2 需要新增的按钮：目标存在但数据库中不存在
                List<String> toAddSuffixes = Arrays.stream(buttonSuffixes)
                        .filter(suffix -> targetButtonSet.contains(suffix.replace("@", "")))
                        .filter(suffix -> !existCodeSet.contains(menu.getCode() + suffix))
                        .toList();
                if (!toAddSuffixes.isEmpty()) {
                    LocalDateTime now = LocalDateTime.now();
                    List<Menu> toAddMenus = toAddSuffixes.stream()
                            .map(suffix -> new Menu()
                                    .setId(YitIdHelper.nextId())
                                    .setParentId(menu.getId())
                                    .setCode(menu.getCode() + suffix)
                                    .setIcon(suffix.equals("@ADD") ? "gridicons:add-outline" : suffix.equals("@EDIT") ? "ep:edit" : suffix.equals("@DELETE") ? "fluent:delete-48-regular" : null)
                                    .setName(suffix.equals("@ADD") ? "新增" : suffix.equals("@EDIT") ? "编辑" : suffix.equals("@DELETE") ? "删除" : null)
                                    .setSort(menu.getSort())
                                    .setStatus(true)
                                    .setType("BUTTON")
                                    .setCreateTime(now))
                            .collect(Collectors.toList());
                    saveBatch(toAddMenus);
                }
            }
        }
    }

    @Override
    public MenuNova details(Details details) {
        Menu menu = getById(details.getValue());
        MenuNova menuNova = BeanCopyUtils.copy(menu, MenuNova.class);
        // 设置父菜单信息
        if (menu.getParentId() != null) {
            Menu parentMenu = getById(menu.getParentId());
            if (parentMenu != null) {
                menuNova.setMenuNova(new MenuNova()
                        .setId(parentMenu.getId())
                        .setName(parentMenu.getName())
                );
            }
        }
        // 查询并封装系统按钮
        if ("NOVA".equals(menu.getType()) && menu.getCode() != null) {
            String menuCode = menu.getCode();
            // 查询当前菜单下的系统按钮
            List<Menu> buttons = list(new LambdaQueryWrapper<Menu>()
                    .eq(Menu::getParentId, menu.getId())
                    .eq(Menu::getType, "BUTTON")
                    .in(Menu::getCode,
                            menuCode + "@ADD",
                            menuCode + "@EDIT",
                            menuCode + "@DELETE")
                    .orderByAsc(Menu::getSort) // 按排序字段排序
            );
            // 提取按钮后缀，用逗号分隔
            if (!buttons.isEmpty()) {
                String sysButton = buttons.stream()
                        .map(btn -> {
                            String code = btn.getCode();
                            int lastIndex = code.lastIndexOf("@");
                            return lastIndex > 0 ? code.substring(lastIndex + 1) : code;
                        })
                        .collect(Collectors.joining(","));
                menuNova.setSysButton(sysButton);
            }
        }
        return menuNova;
    }

    @Override
    public Tree.Vo<MenuNova> tree(Tree tree) {
        String novaName = tree.getNovaName();
        // 查询所有菜单数据
        List<Menu> menus = list(new LambdaUpdateWrapper<Menu>()
                .orderByAsc(Menu::getSort, Menu::getCreateTime)
        );
        // 根据 novaName 决定是否过滤系统按钮
        List<Menu> filteredMenus;
        Map<Long, Set<String>> buttonGroupMap;
        if (novaName.equals(MenuNova.class.getSimpleName())) {
            // 1. 先收集所有系统按钮，按父菜单ID分组
            buttonGroupMap = menus.stream()
                    .filter(menu -> {
                        String code = menu.getCode();
                        return code != null && (code.endsWith("@ADD") || code.endsWith("@EDIT") || code.endsWith("@DELETE"));
                    })
                    .collect(Collectors.groupingBy(
                            Menu::getParentId,
                            Collectors.mapping(
                                    menu -> menu.getCode().substring(menu.getCode().lastIndexOf("@") + 1),
                                    Collectors.toSet()
                            )
                    ));
            // 2. 过滤掉系统按钮，保留其他菜单
            filteredMenus = menus.stream()
                    .filter(menu -> {
                        String code = menu.getCode();
                        if (code == null) return true;
                        // 过滤掉以 @ADD、@EDIT、@DELETE 结尾的按钮
                        return !(code.endsWith("@ADD") || code.endsWith("@EDIT") || code.endsWith("@DELETE"));
                    })
                    .collect(Collectors.toList());
        } else {
            buttonGroupMap = new HashMap<>();
            // 不过滤，保留所有数据
            filteredMenus = menus;
        }
        // 使用 partitioningBy 只需遍历一次，性能更好
        Map<Boolean, List<Menu>> partitioned = filteredMenus.stream()
                .collect(Collectors.partitioningBy(menu -> menu.getParentId() == null));
        // 将根菜单列表转换为 MenuNova 对象列表，并设置 sysButton
        List<MenuNova> rootList = partitioned.get(true).stream()
                .map(menu -> {
                    MenuNova menuNova = BeanCopyUtils.copy(menu, MenuNova.class);
                    // 如果存在按钮分组，设置 sysButton
                    if (!buttonGroupMap.isEmpty()) {
                        Set<String> buttons = buttonGroupMap.get(menu.getId());
                        if (buttons != null && !buttons.isEmpty()) {
                            // 按固定顺序排序：ADD, EDIT, DELETE
                            List<String> sortedButtons = Arrays.asList("ADD", "EDIT", "DELETE").stream()
                                    .filter(buttons::contains)
                                    .collect(Collectors.toList());
                            menuNova.setSysButton(String.join(",", sortedButtons));
                        }
                    }
                    return menuNova;
                })
                .collect(Collectors.toList());
        // 将子菜单列表转换为 MenuNova 对象列表，并设置 sysButton
        List<MenuNova> childrenList = partitioned.get(false).stream()
                .map(menu -> {
                    MenuNova menuNova = BeanCopyUtils.copy(menu, MenuNova.class)
                            .setMenuNova(new MenuNova().setId(menu.getParentId()));
                    // 如果存在按钮分组，设置 sysButton
                    if (!buttonGroupMap.isEmpty()) {
                        Set<String> buttons = buttonGroupMap.get(menu.getId());
                        if (buttons != null && !buttons.isEmpty()) {
                            // 按固定顺序排序：ADD, EDIT, DELETE
                            List<String> sortedButtons = Arrays.asList("ADD", "EDIT", "DELETE").stream()
                                    .filter(buttons::contains)
                                    .collect(Collectors.toList());
                            menuNova.setSysButton(String.join(",", sortedButtons));
                        }
                    }
                    return menuNova;
                })
                .collect(Collectors.toList());
        // 封装返回结果
        return new Tree.Vo<MenuNova>()
                .setRootList(rootList)
                .setChildrenList(childrenList);
    }

    @Override
    public String exec(List<Long> novaIds, Object o, String param) {
        if (param.equals("menu_add")) {
            MenuNova menuNova = (MenuNova) o;
            add(menuNova);
        }
        return null;
    }

    @Override
    public Object novaFormValue(List<Long> novaIds, String param) {
        if (param.equals("menu_add")) {
            Menu menu = getById(novaIds.get(0));
            return new MenuNova().setMenuNova(new MenuNova()
                            .setId(menu.getId())
                            .setName(menu.getName())
                    );
        }
        return null;
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
