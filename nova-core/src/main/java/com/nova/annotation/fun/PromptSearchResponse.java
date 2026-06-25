package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class PromptSearchResponse {

    @Comment("数据总数")
    private long total = 0;

    @Comment("数据列表")
    private List<Record> records;

    @Data
    @Accessors(chain = true)
    public static class Record {

        @Comment("存储列")
        private String storageField;

        @Comment("展示列")
        private String displayField;

    }
}
