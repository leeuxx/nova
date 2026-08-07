package xyz.nova.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.reflections.Reflections;
import org.reflections.scanners.Scanners;
import org.reflections.util.ConfigurationBuilder;
import org.springframework.stereotype.Component;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.constant.NovaConst;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class NovaBootMetadata {

    @Getter
    private static final List<String> routerMenusMethods = new ArrayList<>();

    @PostConstruct
    public void novaRouter() {
        Reflections reflections = new Reflections(
                new ConfigurationBuilder()
                        .forPackages(NovaConst.CONTROLLER_PACKAGE)
                        .setScanners(
                                Scanners.MethodsAnnotated  // 扫描方法上的注解
                        )
        );
        // 获取所有带 @NovaRouter 注解的方法
        reflections.getMethodsAnnotatedWith(NovaRouter.class)
                .forEach(method -> {
                    NovaRouter annotation = method.getAnnotation(NovaRouter.class);
                    if (annotation.verifyType() == NovaRouter.VerifyType.LOGIN_MENU) {
                        String fullMethodName = method.getDeclaringClass().getName() + "." + method.getName();
                        routerMenusMethods.add(fullMethodName);
                    }
                });
    }
}
