package com.nova.annotation.fun;

import com.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;

import java.util.List;

@Data
@Accessors(chain = true)
public class FetchReferencesRequest {

    @Comment("来源nova名称")
    private String novaName;

    @Comment("存储值列表, 参考ReferenceType.storageField属性")
    private List<String> storageFieldValues;

}
