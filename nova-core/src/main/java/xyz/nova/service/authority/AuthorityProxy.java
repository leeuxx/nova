package xyz.nova.service.authority;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.entity.authority.Login;
import xyz.nova.entity.authority.Menu;
import xyz.nova.entity.authority.Register;
import xyz.nova.error.NovaException;

import java.util.List;

public interface AuthorityProxy {

    @Comment("检查token有效性")
    boolean checkToken(String token);

    @Comment("登录")
    Login.User login(Login login);

    @Comment("登出")
    void logout(String token);

    @Comment("获取菜单")
    List<Menu> getMenu(String token);

    @Comment("菜单权限验证")
    boolean menuPermission(String token, String code);

    @Comment("修改用户信息")
    default void editUser(Login.User user) {
        throw new NovaException("AuthorityProxy.editUser未实现");
    }

    @Comment("注册")
    default Login.User register(Register register) {
        throw new NovaException("AuthorityProxy.register未实现");
    }

    @Comment("获取服务名;微服务使用")
    default String getServiceName(String token, String novaName) {
        throw new NovaException("AuthorityProxy.getServiceName未实现");
    }

}
