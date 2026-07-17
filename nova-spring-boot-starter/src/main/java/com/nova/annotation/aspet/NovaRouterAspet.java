package com.nova.annotation.aspet;

import com.nova.annotation.NovaRouter;
import com.nova.service.authority.AuthorityProxy;
import com.nova.utils.AuthorityUtils;
import com.nova.utils.R;
import lombok.AllArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@AllArgsConstructor
public class NovaRouterAspet {

    private AuthorityProxy authorityProxy;

    @Around("@annotation(novaRouter)")
    public Object novaRouter(ProceedingJoinPoint joinPoint, NovaRouter novaRouter) throws Throwable {
        String token = AuthorityUtils.getToken();
        // 验证token有效性
        if (token == null || token.isEmpty() || !authorityProxy.checkToken(token)) {
            return R.fail(520, "授权信息已过期，请重新登录", null);
        }
        // 验证菜单权限
        NovaRouter.VerifyType verifyType = novaRouter.verifyType();
        if (verifyType == NovaRouter.VerifyType.LOGIN_MENU) {
            String menuCode = AuthorityUtils.getMenuCode();
            if (menuCode == null || menuCode.isEmpty() || !authorityProxy.menuPermission(token, menuCode)) {
                return R.fail(521, "用户权限校验未通过", null);
            }
        }
        return joinPoint.proceed(joinPoint.getArgs());
    }

}
