package com.nova.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.nova.annotation.config.Comment;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTableRowOperationSubmit {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("操作类型")
    @NotBlank(message = "type不能为空")
    private String type;

    @Comment("选择的数据novaId集合")
    private List<String> novaIds;

    @Comment("操作处理类")
    private String operationHandler;

    @Comment("操作处理透传参数")
    private String operationParam;

    @Comment("nova条件表单名称")
    private String novaFromName;

    @Comment("表单信息")
    private List<FormInfo> formInfo;

    @Comment("附属对象表单信息")
    private Map<String, List<FormInfo>> appendageFormInfo;

    @Data
    @Accessors(chain = true)
    public static class FormInfo {

        @Comment("属性名")
        private String field;

        @Comment("属性值")
        private String value;

        @Comment("类型")
        private String type;

        @Comment("引用信息")
        private Reference reference;

        @Data
        @Accessors(chain = true)
        public static class Reference {

            @Comment("属性名")
            private String field;

        }
    }

    @Data
    @Accessors(chain = true)
    @JsonSerialize
    public static class Vo {

        @Comment("操作成功后前端需要执行的 js 表达式")
        private String jsExpression;

    }

}
