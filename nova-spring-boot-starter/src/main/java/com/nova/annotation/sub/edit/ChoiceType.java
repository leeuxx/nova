package com.nova.annotation.sub.edit;

import com.nova.annotation.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

public @interface ChoiceType {

    @Comment("显示类型")
    ShowType showType() default ShowType.SELECT;

    @Comment("选择类型")
    SelectType selectType() default SelectType.SINGLE;

    @Comment("静态选择列表")
    VL[] vl() default {};

    @Comment("动态选择列表")
    Class<? extends ChoiceFetchHandler>[] fetchHandler() default {};

    @Comment("可被fetchHandler接口获取到")
    String[] fetchHandlerParams() default {};

    enum ShowType {
        @Comment("下拉列表")
        SELECT,
        @Comment("选择框")
        RADIO
    }

    enum SelectType {
        @Comment("单选")
        SINGLE,
        @Comment("多选")
        MULTI
    }

    interface ChoiceFetchHandler {

        @Comment("获取下拉列表")
        List<VLModel> fetch(String[] params);

        @Data
        @Accessors(chain = true)
        class VLModel {

            @Comment("值")
            private String value;

            @Comment("标签")
            private String label;

            @Comment("表格显示标签颜色（十六进制颜色代码）")
            private String color;

        }
    }
}
