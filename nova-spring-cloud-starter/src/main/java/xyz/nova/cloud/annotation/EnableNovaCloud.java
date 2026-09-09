package xyz.nova.cloud.annotation;

import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

import java.lang.annotation.*;

/**
 * Nova微服务启动注解
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@EnableDiscoveryClient
@EnableFeignClients
public @interface EnableNovaCloud {

}
