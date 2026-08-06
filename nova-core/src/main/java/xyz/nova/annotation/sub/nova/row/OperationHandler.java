package xyz.nova.annotation.sub.nova.row;

import xyz.nova.annotation.config.Comment;

import java.util.List;

public interface OperationHandler<@Comment("行数据类型") NovaIdClass, @Comment("表单输入对象类型") NovaForm> {

    @Comment("按钮事件触发类，返回值：事件触发成功后需要前端执行的 js 表达式，不需要此参数返回空即可")
    String exec(List<NovaIdClass> novaIds, NovaForm novaForm, String param);

    @Comment("初始化 nova 表单的值")
    default NovaForm novaFormValue(List<NovaIdClass> novaIds, String param) {
        return null;
    }
}
