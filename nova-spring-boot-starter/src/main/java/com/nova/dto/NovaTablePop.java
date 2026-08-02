package com.nova.dto;

import com.nova.annotation.config.Comment;
import com.nova.annotation.sub.nova.field.view.PopHandler;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTablePop {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("处理类完全类名")
    @NotBlank(message = "handleName不能为空")
    private String handleName;

    @Comment("点击的数据")
    @NotBlank(message = "value不能为空")
    private String value;

    @Comment("静态参数")
    private String param;

    @Data
    @Accessors(chain = true)
    public static class Vo {

        @Comment("类型")
        private String type;

        @Comment("名称")
        private String name;

        @Comment("值")
        private String value;

    }
}
