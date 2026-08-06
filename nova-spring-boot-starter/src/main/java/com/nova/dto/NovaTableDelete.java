package com.nova.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaTableDelete {

    @Comment("nova名称,必填")
    private String novaName;

    @Comment("novaId属性名,必填")
    private String novaIdFieldName;

    @Comment("novaId值列表,必填")
    private List<String> novaIdValues;

    @Data
    @Accessors(chain = true)
    @JsonSerialize
    public static class Vo {

    }
}
