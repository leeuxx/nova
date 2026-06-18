package com.nova.annotation.sub.edit;

import com.nova.annotation.Comment;

public @interface DateType {

    @Comment("格式类型")
    Type type() default Type.DATE_TIME;

    @Comment("选择模式")
    PickerMode pickerMode() default PickerMode.ALL;

    enum Type {
        @Comment("日期")
        DATE,
        @Comment("时间")
        TIME,
        @Comment("日期时间")
        DATE_TIME,
        @Comment("月份")
        MONTH,
        @Comment("年")
        YEAR
    }

    enum PickerMode {
        @Comment("可选任意时间段")
        ALL,
        @Comment("仅可选择未来时间")
        FUTURE,
        @Comment("仅可选择历史时间")
        HISTORY
    }
}
