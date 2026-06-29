package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class PromptSearch {

    @Comment("当前页")
    private long current = 1;

    @Comment("显示行数")
    private long size = 10;

    @Comment("搜索关键词")
    private String prompt;

    @Comment("来源nova名称")
    private String novaName;

    @Comment("来源上下文属性集合")
    private Map<String, String> sourceFields;

    @Data
    @Accessors(chain = true)
    public static class Vo {

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
}
