package xyz.nova.annotation.aspect;

import cn.hutool.json.JSONUtil;
import lombok.AllArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.i18n.NovaI18nUtils;
import xyz.nova.service.authority.AuthorityProxy;
import xyz.nova.utils.AuthorityUtils;
import xyz.nova.utils.NovaUtils;
import xyz.nova.utils.R;

import java.util.Arrays;
import java.util.Objects;

@Aspect
@Component
@AllArgsConstructor
public class NovaRouterAspect {

    private AuthorityProxy authorityProxy;

    @Around("@annotation(novaRouter)")
    public Object novaRouter(ProceedingJoinPoint joinPoint, NovaRouter novaRouter) throws Throwable {
        // 获取Token并验证有效性
        String token = AuthorityUtils.getToken();
        if (token == null || token.isEmpty() || !authorityProxy.checkToken(token)) {
            return R.fail(520, NovaI18nUtils.get("permission.timeout"), null);
        }
        // 验证菜单权限（仅当校验类型为LOGIN_MENU时）
        NovaRouter.VerifyType verifyType = novaRouter.verifyType();
        if (verifyType == NovaRouter.VerifyType.LOGIN_MENU) {
            String menuCode = AuthorityUtils.getMenuCode();
            // 无菜单编码 || 菜单权限验证未通过 则降级验证Nova权限校验属性
            if (menuCode == null || menuCode.isEmpty() || !authorityProxy.menuPermission(token, menuCode)) {
                String novaName = Arrays.stream(joinPoint.getArgs())
                        .filter(Objects::nonNull)
                        .map(arg -> JSONUtil.parseObj(arg).getStr("novaName"))
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(null);
                if (NovaUtils.getPower(novaName)) {
                    return R.fail(521, NovaI18nUtils.get("permission.check"), null);
                }
            }
        }
        // 执行目标方法
        return joinPoint.proceed(joinPoint.getArgs());
    }

}
