package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class Tree {

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源上下文属性集合")
    private Map<String, String> sourceFields;

    @Data
    @Accessors(chain = true)
    public static class Vo<T> {

        @Comment("根节点数据")
        private List<T> rootList;

        @Comment("子节点数据")
        private List<T> childrenList;

    }
}
