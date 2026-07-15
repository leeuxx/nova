package com.nova.dto;

import com.nova.annotation.config.Comment;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTableTree {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("来源nova名称")
    @NotBlank(message = "sourceNovaName不能为空")
    private String sourceNovaName;

    @Comment("来源上下文属性集合")
    private Map<String, String> sourceFields;

    @Comment("排序")
    private List<OrderItemBean> orders = new ArrayList<>();

    @Comment("操作类存储属性值")
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
    public static class Vo {

        @Comment("根节点数据")
        private List<Map<String, Object>> rootList;

        @Comment("子节点数据")
        private List<Map<String, Object>> childrenList;

    }
}
