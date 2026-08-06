package com.nova.dto;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaTableRowOperationLoad {

    @Comment("nova名称,必填")
    private String novaName;

    @Comment("选择的数据novaId集合")
    private List<String> novaIds;

    @Comment("操作处理类")
    private String operationHandler;

    @Comment("操作处理透传参数")
    private String operationParam;

}
