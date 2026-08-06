package xyz.nova.annotation.sub.nova.field.edit;

import xyz.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

public interface ChoiceFetchHandler {

    @Comment("获取下拉列表")
    List<VLModel> fetch(String param);

    @Data
    @Accessors(chain = true)
    class VLModel {

        @Comment("值")
        private String value;

        @Comment("标签")
        private String label;

        @Comment("表格显示标签颜色（十六进制颜色代码）")
        private String color;

        @Comment("上级关联值（级联选择）")
        private String refValue;

    }

}
