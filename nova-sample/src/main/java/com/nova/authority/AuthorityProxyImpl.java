package com.nova.authority;

import com.github.yitter.idgen.YitIdHelper;
import com.nova.entity.authority.Login;
import com.nova.entity.authority.Menu;
import com.nova.service.authority.AuthorityProxy;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthorityProxyImpl implements AuthorityProxy {

    private static final Map<String, String> map = new LinkedHashMap<>();

    @Override
    public boolean checkToken(String token) {
        String username = map.get(token);
        return username != null;
    }

    @Override
    public Login.Vo login(Login login) {
        String token = String.valueOf(YitIdHelper.nextId());
        map.put(token, login.getUsername());
        return new Login.Vo()
                .setToken(token)
                .setName("张三")
                .setAlias("财务人员")
                .setAvatar("https://avatars.githubusercontent.com/u/10251080?s=200&v=4");
    }

    @Override
    public void logout(String token) {
        map.remove(token);
    }

    @Override
    public List<Menu> getMenu(String token) {
        return Arrays.asList(
                new Menu()
                        .setId(1L)
                        .setCode("home")
                        .setName("主页")
                        .setIcon("material-symbols:home-outline"),
                new Menu()
                        .setId(2L)
                        .setCode("sys")
                        .setName("系统管理")
                        .setIcon("material-symbols:settings-outline"),
                new Menu()
                        .setId(3L)
                        .setCode("user")
                        .setValue("TestDemoView")
                        .setType("table")
                        .setName("用户管理")
                        .setIcon("material-symbols:person-outline")
                        .setPid(2L),
                new Menu()
                        .setId(4L)
                        .setCode("role")
                        .setValue("TestDemo2View")
                        .setType("table")
                        .setName("部门管理")
                        .setIcon("material-symbols:group-outline")
                        .setPid(2L),
                new Menu()
                        .setId(5L)
                        .setCode("menu")
                        .setValue("MENU")
                        .setType("tpl")
                        .setName("菜单管理")
                        .setIcon("material-symbols:menu")
                        .setPid(2L)
        );
    }
}
