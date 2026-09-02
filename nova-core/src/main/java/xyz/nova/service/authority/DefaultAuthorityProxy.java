package xyz.nova.service.authority;

import xyz.nova.entity.authority.Login;
import xyz.nova.entity.authority.Menu;
import xyz.nova.entity.authority.Register;
import xyz.nova.error.NovaException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;
import xyz.nova.i18n.NovaI18nUtils;

import java.util.List;

@Component
@ConditionalOnMissingBean(value = AuthorityProxy.class, ignored = DefaultAuthorityProxy.class)
public class DefaultAuthorityProxy implements AuthorityProxy {

    @Override
    public boolean checkToken(String token) {
        return false;
    }

    @Override
    public Login.User login(Login login) {
        throw new NovaException(NovaI18nUtils.get("permission.none", NovaI18nUtils.SourceType.CODE));
    }

    @Override
    public void logout(String token) {
        throw new NovaException(NovaI18nUtils.get("permission.none", NovaI18nUtils.SourceType.CODE));
    }

    @Override
    public List<Menu> getMenu(String token) {
        throw new NovaException(NovaI18nUtils.get("permission.none", NovaI18nUtils.SourceType.CODE));
    }

    @Override
    public boolean menuPermission(String token, String code) {
        return false;
    }

    @Override
    public void editUser(Login.User user) {
        throw new NovaException(NovaI18nUtils.get("permission.none", NovaI18nUtils.SourceType.CODE));
    }

    @Override
    public Login.User register(Register register) {
        throw new NovaException(NovaI18nUtils.get("permission.none", NovaI18nUtils.SourceType.CODE));
    }
}
