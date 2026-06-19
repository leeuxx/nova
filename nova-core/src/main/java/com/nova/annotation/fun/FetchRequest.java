package com.nova.annotation.fun;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class FetchRequest<T> {

    @Comment("源对象（自行实现查询条件构造）")
    private Source source;

    @Comment("mybatisPlus对象（框架自动构造查询条件,业务可继续追加）")
    private MybatisPLus<T> mybatisPLus;

    @Data
    @Accessors(chain = true)
    public static class Source {

        @Comment("当前页")
        private long current = 1;

        @Comment("显示行数")
        private long size = 10;

        @Comment("查询条件")
        private Map<String, Search> conditions;

        @Comment("排序")
        private List<OrderItemBean> orders = new ArrayList<>();

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
    }

    @Data
    @Accessors(chain = true)
    public static class MybatisPLus<T> {

        @Comment("分页信息")
        private Page<T> page;

        @Comment("mybatisPlus查询构造器")
        private LambdaQueryWrapper<T> wrapper;

    }
}
