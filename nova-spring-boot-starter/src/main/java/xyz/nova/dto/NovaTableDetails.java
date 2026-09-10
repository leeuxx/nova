package xyz.nova.dto;

import xyz.nova.annotation.comment.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class NovaTableDetails {

    @Comment("nova名称,必填")
    private String novaName;

    @Comment("来源类型,必填（MAIN=主详情查询 REFERENCE=编辑tab详情查询 APPENDAGE=编辑附属详情查询）")
    private String sourceType;

    @Comment("来源值,必填")
    private String storageFieldValue;

}
