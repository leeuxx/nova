package com.nova.controller;

import com.nova.annotation.NovaRouter;
import com.nova.annotation.config.Comment;
import com.nova.annotation.config.RestMappingController;
import com.nova.entity.authority.Login;
import com.nova.entity.authority.Menu;
import com.nova.service.authority.AuthorityProxy;
import com.nova.utils.AuthorityUtils;
import com.nova.utils.R;
import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@AllArgsConstructor
@RestMappingController("nova/authority")
public class NovaAuthorityController {

    private AuthorityProxy authorityProxy;

    @Comment("检查token有效性")
    @PostMapping("checkToken")
    public R<Boolean> checkToken() {
        String token = AuthorityUtils.getToken();
        if (token == null || token.isEmpty()) {
            return R.ok(false);
        }
        boolean checkToken = authorityProxy.checkToken(AuthorityUtils.getToken());
        return R.ok(checkToken);
    }

    @Comment("登录")
    @PostMapping("login")
    public R<Login.User> login(@RequestBody @Validated Login login) {
        Login.User user = authorityProxy.login(login);
        return R.ok(user);
    }

    @Comment("登出")
    @PostMapping("logout")
    @NovaRouter
    public R logout() {
        authorityProxy.logout(AuthorityUtils.getToken());
        return R.ok();
    }

    @Comment("获取菜单")
    @PostMapping("getMenu")
    @NovaRouter
    public R<List<Menu>> getMenu() {
        List<Menu> menus = authorityProxy.getMenu(AuthorityUtils.getToken());
        if (menus == null || menus.isEmpty()) {
            return R.ok(menus);
        }
        // 收集所有 show != false 的 id
        Set<Long> visibleIds = menus.stream()
                .filter(m -> m.getShow() != Boolean.FALSE)
                .map(Menu::getId)
                .collect(Collectors.toSet());
        // id → Menu 索引，用于沿父链查找
        Map<Long, Menu> idMap = menus.stream()
                .collect(Collectors.toMap(Menu::getId, m -> m, (a, b) -> a));
        // 过滤：父隐藏则子也隐藏
        List<Menu> visibleMenus = menus.stream().filter(m -> {
            if (!visibleIds.contains(m.getId())) return false;
            Long pid = m.getPid();
            while (pid != null) {
                if (!visibleIds.contains(pid)) return false;
                Menu parent = idMap.get(pid);
                pid = (parent != null) ? parent.getPid() : null;
            }
            return true;
        }).collect(Collectors.toList());
        return R.ok(visibleMenus);
    }

}
