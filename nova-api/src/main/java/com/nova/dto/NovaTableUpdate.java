package com.nova.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.nova.annotation.Comment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaTableUpdate {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("主键值")
    @NotNull(message = "pkValue不能为空")
    private String pkValue;

    @Comment("表单信息")
    @NotEmpty(message = "formInfo不能为空")
    private List<FormInfo> formInfo;

    @Data
    @Accessors(chain = true)
    public static class FormInfo {

        @Comment("属性名")
        private String field;

        @Comment("属性值")
        private String value;

        @Comment("类型")
        private String type;

    }

    @Data
    @Accessors(chain = true)
    @JsonSerialize
    public static class Vo {

    }
}
