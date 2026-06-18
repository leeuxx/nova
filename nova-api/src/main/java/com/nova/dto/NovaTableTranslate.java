package com.nova.dto;

import com.nova.annotation.Comment;
import com.nova.dto.page.PageBean;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;
import java.util.Map;

@Data
@Accessors(chain = true)
public class NovaTableTranslate {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("待翻译数据")
    private Map<String, DataInfo> dataInfos;

    @Data
    @Accessors(chain = true)
    public static class DataInfo {

        @Comment("类型")
        private String type;

        @Comment("待翻译数据")
        private List<String> datas;

    }

    @Data
    @Accessors(chain = true)
    public static class Vo {

        @Comment("已翻译数据")
        private Map<String, List<String>> dataInfos;

    }
}
