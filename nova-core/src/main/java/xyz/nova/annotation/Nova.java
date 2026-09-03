package xyz.nova.annotation;

import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.sub.nova.*;
import xyz.nova.service.data.DataProxy;
import xyz.nova.annotation.sub.nova.row.RowOperation;
import xyz.nova.service.data.DefaultDataProxy;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
public @interface Nova {

    @Comment("功能名称")
    String name();

    @Comment("数据行为代理接口，对增、删、改、查等行为做逻辑处理")
    Class<? extends DataProxy<?, ?>> dataProxy() default DefaultDataProxy.class;

    @Comment("查询条件构造类")
    Class<?> conditionClass() default void.class;

    @Comment("功能描述")
    String desc() default "";

    @Comment("排序表达式")
    String orderBy() default "";

    @Comment("功能布局")
    Layout layout() default @Layout;

    @Comment("自定义功能按钮")
    RowOperation[] rowOperation() default {};

    @Comment("树结构配置")
    TreeType tree() default @TreeType(value = false, label = "");

    @Comment("数据钻取")
    Drill[] drills() default {};

    @Comment("权限验证")
    boolean power() default true;

    @Comment("表格行系统按钮隐藏控制")
    SysBtnHide sysBtnHide() default @SysBtnHide;

    @Comment("双表视图表列宽度压缩系数（值越小列越窄, 不可小于0, 最大值为1表示原样）")
    double dualShrink() default 0.8;

    @Comment("提示框配置")
    Tooltip tooltip() default @Tooltip;

}
