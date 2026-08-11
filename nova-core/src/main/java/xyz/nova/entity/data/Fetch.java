package xyz.nova.entity.data;

import lombok.Data;
import lombok.experimental.Accessors;
import xyz.nova.annotation.comment.Comment;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class Fetch<CONDITION> {

    @Comment("当前页")
    private long current = 1;

    @Comment("显示行数")
    private long size = 10;

    @Comment("排序")
    private List<OrderItemBean> orders;

    @Comment("查询条件")
    private CONDITION condition;

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源上下文信息")
    @Comment("key:上下文属性名, value:上下文属性值")
    private Map<String, String> context;

    @Data
    @Accessors(chain = true)
    public static class Vo<MODEL> {

        @Comment("数据总数")
        private long total = 0;

        @Comment("数据列表")
        private List<MODEL> records = Collections.emptyList();

    }
}
