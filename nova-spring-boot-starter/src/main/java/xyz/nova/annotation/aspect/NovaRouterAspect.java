package xyz.nova.annotation.aspect;

import cn.hutool.json.JSONUtil;
import lombok.AllArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.boot.autoconfigure.condition.ConditionOutcome;
import org.springframework.boot.autoconfigure.condition.SpringBootCondition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.stereotype.Component;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.constant.NovaConst;
import xyz.nova.service.authority.AuthorityProxy;
import xyz.nova.utils.AuthorityUtils;
import xyz.nova.utils.NovaUtils;
import xyz.nova.utils.R;

import java.util.Arrays;
import java.util.Objects;

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
            return R.fail(520, "Authorization expired, please login again", null);
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
                    return R.fail(521, "User permission verification failed", null);
                }
            }
        }
        // 执行目标方法
        return joinPoint.proceed(joinPoint.getArgs());
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
