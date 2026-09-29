package xyz.nova.annotation.aspect;

import cn.hutool.json.JSONUtil;
import lombok.AllArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.boot.autoconfigure.condition.ConditionOutcome;
import org.springframework.boot.autoconfigure.condition.SpringBootCondition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.constant.NovaConst;
import xyz.nova.service.authority.AuthorityProxy;
import xyz.nova.utils.AuthorityUtils;
import xyz.nova.utils.NovaUtils;
import xyz.nova.utils.R;

import java.io.IOException;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;

@Aspect
@Component
@AllArgsConstructor
@Conditional(NovaRouterAspect.SlaveModeCondition.class)
public class NovaRouterAspect {

    private AuthorityProxy authorityProxy;

    @Around("@annotation(novaRouter)")
    public Object novaRouter(ProceedingJoinPoint joinPoint, NovaRouter novaRouter) throws Throwable {
        // 获取Token并验证有效性
        String token = AuthorityUtils.getToken();
        if (token == null || token.isEmpty() || !authorityProxy.checkToken(token)) {
            return buildAuthFailResult(joinPoint, 520, "Authorization expired, please login again");
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
                    return buildAuthFailResult(joinPoint, 521, "User permission verification failed");
                }
            }
        }
        // 执行目标方法
        return joinPoint.proceed(joinPoint.getArgs());
    }

    /**
     * 根据目标方法的返回类型决定鉴权失败时返回什么：
     * <ul>
     *     <li>返回类型是 {@link SseEmitter}（或子类）→ 返回一个发送 error 事件后立即完成的 SseEmitter</li>
     *     <li>其它情况 → 返回普通的 {@link R} 对象</li>
     * </ul>
     */
    private Object buildAuthFailResult(ProceedingJoinPoint joinPoint, int code, String msg) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Class<?> returnType = signature.getMethod().getReturnType();
        if (SseEmitter.class.isAssignableFrom(returnType)) {
            SseEmitter emitter = new SseEmitter(0L);
            // 关键：异步发送，等 Spring MVC 接管 emitter 后再写数据
            CompletableFuture.runAsync(() -> {
                try {
                    emitter.send(SseEmitter.event().name(String.valueOf(code))
                            .data(msg));
                    emitter.complete();
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            });
            // 返回未初始化的 emitter，交给 Spring MVC
            return emitter;
        }
        return R.fail(code, msg, null);
    }

    public static class SlaveModeCondition extends SpringBootCondition {

        @Override
        public ConditionOutcome getMatchOutcome(ConditionContext context, AnnotatedTypeMetadata metadata) {
            // 检查是否有cloud依赖
            boolean hasCloudDependency;
            try {
                Class.forName("com.alibaba.cloud.nacos.NacosDiscoveryProperties");
                hasCloudDependency = true;
            } catch (ClassNotFoundException e) {
                hasCloudDependency = false;
            }
            if (!hasCloudDependency) {
                return ConditionOutcome.match("Standalone mode, need auth");  // ⭐ 单体 → 加载
            }
            // 读取 nova.cloud.master 配置
            String master = context.getEnvironment().getProperty(NovaConst.CLOUD_MASTER_KEY, "false");
            boolean isMaster = "true".equals(master);
            if (isMaster) {
                return ConditionOutcome.match("Master mode, need auth");      // ⭐ 主节点 → 加载
            } else {
                return ConditionOutcome.noMatch("Slave mode, no auth");       // ⭐ 子节点 → 不加载
            }
        }

    }
}