package com.nova.entity.data;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class Details {

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源值（来源分为两类：自身反显=自身novaId 其他触发=组件配置的关联字段）")
    private String value;

}
