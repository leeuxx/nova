package com.nova.dto;

import com.nova.annotation.config.Comment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaTableReferencesData {

    @Comment("来源nova名称")
    @NotBlank(message = "sourceNovaName不能为空")
    private String sourceNovaName;

    @Comment("存储值列表")
    @NotEmpty(message = "storageFields不能为空")
    private List<StorageField> storageFields;

    @Data
    @Accessors(chain = true)
    public static class StorageField {

        @Comment("nova名称")
        @NotBlank(message = "novaName不能为空")
        private String novaName;

        @Comment("存储值列表")
        @NotEmpty(message = "novaIdValues不能为空")
        private List<String> storageFieldValues;

    }

}
