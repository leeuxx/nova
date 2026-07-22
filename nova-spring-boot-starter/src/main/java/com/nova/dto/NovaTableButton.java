package com.nova.dto;

import com.nova.annotation.config.Comment;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTableButton {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("处理类完全类名")
    @NotBlank(message = "handleName不能为空")
    private String handleName;

    @Comment("静态参数")
    private String param;

    @Comment("当前类表单上下文信息")
    private Map<String, String> transmitParams;

    @Data
    @Accessors(chain = true)
    public static class Vo {

        @Comment("成功/失败")
        private Boolean status;

        @Comment("提示信息")
        private String message;
    }
}
