package xyz.nova.annotation;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.Drill;
import xyz.nova.service.data.DataProxy;
import xyz.nova.annotation.sub.nova.Layout;
import xyz.nova.annotation.sub.nova.TreeType;
import xyz.nova.annotation.sub.nova.row.RowOperation;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
public @interface Nova {

    @Comment("功能名称")
    String name();

    @Comment("功能描述")
    String desc() default "";

    @Comment("排序表达式")
    String orderBy() default "";

    @Comment("功能布局")
    Layout layout() default @Layout;

    @Comment("数据行为代理接口，对增、删、改、查等行为做逻辑处理")
    Class<? extends DataProxy<?>> dataProxy();

    @Comment("自定义功能按钮")
    RowOperation[] rowOperation() default {};

    @Comment("树结构配置")
    TreeType tree() default @TreeType(value = false, label = "");

    @Comment("数据钻取")
    Drill[] drills() default {};

    @Comment("权限验证")
    boolean power() default true;
}
