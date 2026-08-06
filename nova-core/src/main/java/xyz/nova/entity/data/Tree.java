package xyz.nova.entity.data;

import xyz.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class Tree {

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源上下文信息")
    private Map<String, String> context;

    @Comment("排序")
    private List<OrderItemBean> orders = new ArrayList<>();

    @Comment("操作类关联值")
    private String operateValue;

    @Data
    @Accessors(chain = true)
    public static class OrderItemBean {

        @Comment("需要进行排序的字段")
        private String column;

        @Comment("是否正序排列，默认 true")
        private boolean asc = true;
    }

    @Data
    @Accessors(chain = true)
    public static class Vo<T> {

        @Comment("根节点数据")
        private List<T> rootList;

        @Comment("子节点数据")
        private List<T> childrenList;

    }
}
