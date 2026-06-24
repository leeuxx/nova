package com.nova.dto;

import com.nova.annotation.config.Comment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.experimental.Accessors;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@Accessors(chain = true)
public class AttachmentUpload {

    @Comment("nova名称")
    @NotBlank(message = "novaName不能为空")
    private String novaName;

    @Comment("文件信息")
    @NotEmpty(message = "文件列表不能为空")
    private List<MultipartFile> files;

}
