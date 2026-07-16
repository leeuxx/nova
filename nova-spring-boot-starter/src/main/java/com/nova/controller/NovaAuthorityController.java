package com.nova.controller;

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

@AllArgsConstructor
@RestMappingController("nova/authority")
public class NovaAuthorityController {

    private AuthorityProxy authorityProxy;

    @Comment("检查token有效性")
    @PostMapping("checkToken")
    public R<Boolean> checkToken() {
        String token = AuthorityUtils.getToken();
        boolean checkToken = authorityProxy.checkToken(token);
        return R.ok(checkToken);
    }

    @Comment("登录")
    @PostMapping("login")
    public R<Login.Vo> login(@RequestBody @Validated Login login) {
        Login.Vo vo = authorityProxy.login(login);
        return R.ok(vo);
    }

    @Comment("获取菜单")
    @PostMapping("getMenu")
    public R<List<Menu>> getMenu() {
        String token = AuthorityUtils.getToken();
        boolean checkToken = authorityProxy.checkToken(token);
        if (!checkToken) {
            return R.fail(520, "token无效", null);
        }
        List<Menu> menu = authorityProxy.getMenu(AuthorityUtils.getToken());
        return R.ok(menu);
    }

}
