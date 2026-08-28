package xyz.nova.annotation.sub.nova.field.view;

import xyz.nova.annotation.comment.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;

public interface PopHandler {

    @Comment("获取pop列表, param=透传参数 value=点击的数据 context=同一行其他属性值")
    List<PopModel> getPopModel(String param, String value, Map<String, Object> context);

    @Data
    @Accessors(chain = true)
    class PopModel {

        @Comment("类型")
        private Type type = Type.TEXT;

        @Comment("名称")
        private String name;

        @Comment("值")
        private String value;

    }

    enum Type {
        @Comment("文本")
        TEXT,
        @Comment("布尔")
        BOOLEAN,
        @Comment("标签（使用,号分隔）")
        TAG
    }

}
