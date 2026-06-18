package com.nova.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.nova.annotation.Comment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaTableDelete {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("主键值列表")
    @NotEmpty(message = "pkValues不能为空")
    private List<String> pkValues;

    @Data
    @Accessors(chain = true)
    @JsonSerialize
    public static class Vo {

    }
}
