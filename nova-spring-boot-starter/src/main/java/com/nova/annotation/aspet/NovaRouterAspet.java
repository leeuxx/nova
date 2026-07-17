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
        if (token == null || token.isEmpty() || !authorityProxy.checkToken(token)) {
            return R.fail(520, "token无效", null);
        }
        return joinPoint.proceed(joinPoint.getArgs());
    }

}
