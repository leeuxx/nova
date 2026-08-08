package xyz.nova.dto;

import xyz.nova.annotation.comment.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class NovaTableReferencesData {

    @Comment("来源nova名称,必填")
    private String sourceNovaName;

    @Comment("存储值列表,必填")
    private List<StorageField> storageFields;

    @Data
    @Accessors(chain = true)
    public static class StorageField {

        @Comment("nova名称,必填")
        private String novaName;

        @Comment("存储值列表,必填")
        private List<String> storageFieldValues;

    }

}
