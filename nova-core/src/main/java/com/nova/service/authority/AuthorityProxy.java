package com.nova.service.authority;

import com.nova.annotation.config.Comment;
import com.nova.entity.authority.Login;
import com.nova.entity.authority.Menu;

import java.util.List;

public interface AuthorityProxy {

    @Comment("检查token有效性")
    boolean checkToken(String token);

    @Comment("登录")
    Login.Vo login(Login login);

    @Comment("登出")
    void logout(String token);

    @Comment("获取菜单")
    List<Menu> getMenu(String token);

}
