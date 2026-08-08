package xyz.nova.annotation;

import xyz.nova.annotation.comment.Comment;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Documented
public @interface NovaRouter {

    @Comment("验证类型")
    VerifyType verifyType() default VerifyType.LOGIN;

    enum VerifyType {
        @Comment("验证是否登录")
        LOGIN,
        @Comment("验证是否登录与菜单权限")
        LOGIN_MENU
    }
}
