package xyz.nova.annotation.aspet;

import lombok.AllArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.controller.NovaTableController;
import xyz.nova.dto.NovaTableBuild;
import xyz.nova.service.authority.AuthorityProxy;
import xyz.nova.utils.AuthorityUtils;
import xyz.nova.utils.NovaUtils;
import xyz.nova.utils.R;

import java.lang.reflect.Method;
import java.util.Arrays;

@Aspect
@Component
@AllArgsConstructor
public class NovaRouterAspet {

    private AuthorityProxy authorityProxy;

    @Around("@annotation(novaRouter)")
    public Object novaRouter(ProceedingJoinPoint joinPoint, NovaRouter novaRouter) throws Throwable {
        // 获取Token并验证有效性
        String token = AuthorityUtils.getToken();
        if (token == null || token.isEmpty() || !authorityProxy.checkToken(token)) {
            return R.fail(520, "授权信息已过期，请重新登录", null);
        }
        // 验证菜单权限（仅当校验类型为LOGIN_MENU时）
        NovaRouter.VerifyType verifyType = novaRouter.verifyType();
        if (verifyType == NovaRouter.VerifyType.LOGIN_MENU) {
            String menuCode = AuthorityUtils.getMenuCode();
            if (menuCode == null || menuCode.isEmpty() || !authorityProxy.menuPermission(token, menuCode)) {
                // 判断是否为build接口
                MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                Method method = signature.getMethod();
                boolean isBuild = "build".equals(method.getName()) && NovaTableController.class.getName().equals(method.getDeclaringClass().getName());
                // 非build接口直接返回权限校验失败
                if (!isBuild) {
                    return R.fail(521, "用户权限校验未通过", null);
                }
                // build接口使用Nova权限校验
                String novaName = Arrays.stream(joinPoint.getArgs())
                        .filter(arg -> arg instanceof NovaTableBuild)
                        .map(arg -> ((NovaTableBuild) arg).getNovaName())
                        .findFirst()
                        .orElse(null);
                if (NovaUtils.getPower(novaName)) {
                    return R.fail(521, "用户权限校验未通过", null);
                }
            }
        }
        // 执行目标方法
        return joinPoint.proceed(joinPoint.getArgs());
    }

}
