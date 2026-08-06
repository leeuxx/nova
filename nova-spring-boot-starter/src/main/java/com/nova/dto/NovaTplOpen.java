package com.nova.dto;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaTplOpen {

    @Comment("nova名称,必填")
    private String novaName;

    @Comment("novaId值列表")
    private List<String> novaIdValues;

    @Comment("模板文件路径")
    private String path;

    @Comment("透传参数")
    private String operationParam;

}
