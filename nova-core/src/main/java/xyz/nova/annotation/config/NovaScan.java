package xyz.nova.annotation.config;

import xyz.nova.config.NovaApplication;
import org.springframework.context.annotation.Import;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
@Documented
@Import({NovaApplication.class})
@Comment("Nova项目包扫描核心注解")
public @interface NovaScan {

    @Comment("需要被扫描的包名")
    String[] value() default {};

}
