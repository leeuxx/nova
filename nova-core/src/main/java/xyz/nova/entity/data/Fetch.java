package xyz.nova.entity.data;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.comment.Comment;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class Fetch {

    @Comment("当前页")
    private long current = 1;

    @Comment("显示行数")
    private long size = 10;

    @Comment("排序")
    private List<OrderItemBean> orders;

    @Comment("查询条件")
    @Comment("key:属性名, value:查询条件详情")
    private Map<String, Search> conditions;

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源上下文信息")
    @Comment("key:上下文属性名, value:上下文属性值")
    private Map<String, String> context;

    @Data
    @Accessors(chain = true)
    public static class Search {

        @Comment("属性值")
        private String value;

        @Comment("属性类型")
        private String type;

        @Comment("是否高级查询")
        private Boolean vague;

    }

    @Data
    @Accessors(chain = true)
    public static class Vo<T> {

        @Comment("数据总数")
        private long total = 0;

        @Comment("数据列表")
        private List<T> records = Collections.emptyList();

    }
}
