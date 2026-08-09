package xyz.nova.entity.data;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.comment.Comment;

import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class Tree {

    @Comment("排序")
    private List<OrderItemBean> orders;

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源上下文信息")
    @Comment("key:上下文属性名, value:上下文属性值")
    private Map<String, String> context;

    @Comment("操作类关联值")
    private String operateValue;

    @Data
    @Accessors(chain = true)
    public static class Vo<T> {

        @Comment("根节点数据")
        private List<T> rootList;

        @Comment("子节点数据")
        private List<T> childrenList;

    }
}
