package com.nova.entity.data;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.ArrayList;
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
    private List<OrderItemBean> orders = new ArrayList<>();

    @Comment("查询条件")
    private Map<String, Search> conditions;

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源上下文信息")
    private Map<String, String> context;

    @Comment("LINK组件查询条件")
    private Map<String, Map<String, String>> linkConditions;

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
    public static class OrderItemBean {

        @Comment("需要进行排序的字段")
        private String column;

        @Comment("是否正序排列，默认 true")
        private boolean asc = true;
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
