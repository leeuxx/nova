package com.nova.annotation.sub.edit;

import com.nova.annotation.Comment;

public enum EditType {

    @Comment("自动匹配")
    AUTO,

    @Comment("输入框")
    INPUT,

    @Comment("选择组件")
    CHOICE,

    @Comment("日期时间")
    DATE
}
