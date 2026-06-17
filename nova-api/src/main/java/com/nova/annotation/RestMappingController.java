package com.nova.annotation;

import org.springframework.core.annotation.AliasFor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.annotation.*;

/**
 * mvc复合注解
 *
 * @author lijin
 */
//@Target(ElementType.TYPE)
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@RestController
@RequestMapping
public @interface RestMappingController {
    @AliasFor("path")
    String[] value() default {};

    @AliasFor("value")
    String[] path() default {};
}
