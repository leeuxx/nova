package com.nova.other;

import com.github.yitter.idgen.YitIdHelper;
import com.nova.entity.authority.Login;
import com.nova.entity.authority.Menu;
import com.nova.entity.authority.Register;
import com.nova.service.authority.AuthorityProxy;
import com.nova.utils.collections.list.JArrayList;
import com.nova.utils.collections.list.JList;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthorityProxyImpl implements AuthorityProxy {

    private static final Map<String, String> map = new LinkedHashMap<>();

    private static final JList<Menu> menus = new JArrayList<>() {{
        add(new Menu()
                .setId(1L)
                .setCode("home")
                .setName("主页")
                .setIcon("material-symbols:home-outline")
        );
        add(new Menu()
                .setId(2L)
                .setCode("sys")
                .setName("系统管理")
                .setIcon("material-symbols:settings-outline")
        );
        add(new Menu()
                .setId(100L)
                .setCode("user")
                .setValue("TestDemoView")
                .setName("用户管理")
                .setIcon("material-symbols:person-outline")
                .setPid(2L)
                .setType(Menu.Type.NOVA)
                .setSystemButton(new Menu.SystemButton()
                        .setAdd(true)
                        .setEdit(true)
                        .setDelete(true)
                )
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("role")
                .setValue("TestDemo2View")
                .setName("部门管理")
                .setIcon("material-symbols:group-outline")
                .setPid(2L)
                .setType(Menu.Type.NOVA)
                .setSystemButton(new Menu.SystemButton()
                        .setAdd(true)
                        .setEdit(true)
                        .setDelete(true)
                )
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("sendCmd")
                .setValue("sendCmd")
                .setName("下发指令")
                .setPid(100L)
                .setType(Menu.Type.BUTTON)
        );
        add(new Menu()
                .setId(1000L)
                .setCode("tpl")
                .setName("自定义管理")
                .setIcon("material-symbols:accessibility")
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("localTpl")
                .setValue("tpl/test.html")
                .setName("本地tpl")
                .setIcon("material-symbols:account-child-invert")
                .setPid(1000L)
                .setType(Menu.Type.TPL)
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("httpTpl")
                .setValue("https://www.baidu.com")
                .setName("远程tpl")
                .setIcon("material-symbols:add-to-drive-outline-rounded")
                .setPid(1000L)
                .setType(Menu.Type.TPL)
        );
        add(new Menu()
                .setId(1001L)
                .setCode("tplml")
                .setName("下级目录")
                .setIcon("material-symbols:add-to-drive-outline-rounded")
                .setPid(1000L)
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("httpTpl2")
                .setValue("https://www.baidu.com")
                .setName("远程tpl2")
                .setIcon("material-symbols:add-to-drive-outline-rounded")
                .setPid(1001L)
                .setType(Menu.Type.TPL)
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("httpTpl3")
                .setValue("https://www.baidu.com")
                .setName("远程tpl3")
                .setIcon("material-symbols:add-to-drive-outline-rounded")
                .setPid(1001L)
                .setType(Menu.Type.TPL)
        );

        add(new Menu()
                .setId(3L)
                .setCode("hide")
                .setName("隐藏功能")
                .setShow(false)
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("station")
                .setValue("TestDemo3View")
                .setName("岗位管理")
                .setPid(3L)
                .setType(Menu.Type.NOVA)
                .setSystemButton(new Menu.SystemButton()
                        .setAdd(true)
                        .setEdit(true)
                        .setDelete(true)
                )
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("salary")
                .setValue("TestDemo4View")
                .setName("薪资管理")
                .setPid(3L)
                .setType(Menu.Type.NOVA)
                .setSystemButton(new Menu.SystemButton()
                        .setAdd(true)
                        .setEdit(true)
                        .setDelete(true)
                )
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("refUser")
                .setValue("TestDemoRef2View")
                .setName("引用用户")
                .setPid(3L)
                .setType(Menu.Type.NOVA)
                .setSystemButton(new Menu.SystemButton()
                        .setAdd(true)
                        .setEdit(true)
                        .setDelete(true)
                )
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("refSalary")
                .setValue("TestDemoRefView")
                .setName("引用薪资")
                .setPid(3L)
                .setType(Menu.Type.NOVA)
                .setSystemButton(new Menu.SystemButton()
                        .setAdd(true)
                        .setEdit(true)
                        .setDelete(true)
                )
        );
        add(new Menu()
                .setId(10L)
                .setCode("testRow")
                .setValue("TestRow")
                .setName("测试行")
                .setPid(3L)
                .setType(Menu.Type.NOVA)
        );
        add(new Menu()
                .setId(YitIdHelper.nextId())
                .setCode("demos")
                .setValue("demos")
                .setName("测试按钮")
                .setPid(10L)
                .setType(Menu.Type.BUTTON)
        );
    }};

    @Override
    public boolean checkToken(String token) {
        String username = map.get(token);
        return username != null;
    }

    @Override
    public Login.User login(Login login) {
        String token = String.valueOf(YitIdHelper.nextId());
        map.put(token, login.getUsername());
        return new Login.User()
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
        return menus;
    }

    @Override
    public boolean menuPermission(String token, String code) {
        Menu menu = menus.filter().eq(Menu::getCode, code).object();
        return menu != null;
    }

    @Override
    public void editUser(Login.User user) {
        return;
    }

    @Override
    public Login.User register(Register register) {
        String token = String.valueOf(YitIdHelper.nextId());
        map.put(token, register.getUsername());
        return new Login.User()
                .setToken(token)
                .setName("李四")
                .setAlias("人事部主任")
                .setAvatar("https://img0.baidu.com/it/u=2135555536,3638276976&fm=253&app=138&f=JPEG?w=500&h=500");
    }
}
