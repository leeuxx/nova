package xyz.nova.dto;

import xyz.nova.annotation.config.Comment;
import lombok.Data;
import lombok.experimental.Accessors;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@Accessors(chain = true)
public class AttachmentUpload {

    @Comment("nova名称,必填")
    private String novaName;

    @Comment("文件信息,必填")
    private List<MultipartFile> files;

}
