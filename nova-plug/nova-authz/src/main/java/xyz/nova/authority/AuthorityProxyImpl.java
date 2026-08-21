package xyz.nova.authority;

import com.github.yitter.idgen.YitIdHelper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.nova.entity.authority.Login;
import xyz.nova.entity.authority.Menu;
import xyz.nova.service.MenuServiceImpl;
import xyz.nova.service.authority.AuthorityProxy;
import xyz.nova.utils.BeanCopyUtils;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class AuthorityProxyImpl implements AuthorityProxy {

    private MenuServiceImpl menuService;

    @Override
    public boolean checkToken(String token) {
        return true;
    }

    @Override
    public Login.User login(Login login) {
        String token = String.valueOf(YitIdHelper.nextId());
        return new Login.User()
                .setToken(token)
                .setName("张三")
                .setAlias("财务人员")
                .setAvatar("https://avatars.githubusercontent.com/u/10251080?s=200&v=4");
    }

    @Override
    public void logout(String token) {

    }

    @Override
    public List<Menu> getMenu(String token) {
        List<xyz.nova.entity.Menu> list = menuService.list();
        List<Menu> menus = new ArrayList<>(list.size());
        list.forEach(m -> {
            Menu menu = BeanCopyUtils.copy(m, Menu.class)
                    .setPid(m.getParentId())
                    .setShow(m.getStatus())
                    .setType(m.getType().equals("DIR") ? Menu.Type.DIR
                            : m.getType().equals("NOVA") ? Menu.Type.NOVA
                            : m.getType().equals("TPL") ? Menu.Type.TPL
                            : m.getType().equals("BUTTON") ? Menu.Type.BUTTON
                            : null
                    )
                    .setSystemButton(new Menu.SystemButton()
                            .setAdd(true)
                            .setEdit(true)
                            .setDelete(true)
                    );
            menus.add(menu);
        });
        return menus;
    }

    @Override
    public boolean menuPermission(String token, String code) {
        return true;
    }

}
