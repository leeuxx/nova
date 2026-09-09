package xyz.nova.cloud.controller;

import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import xyz.nova.annotation.NovaRouter;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.config.RestMappingController;
import xyz.nova.cloud.utils.NovaFeignUtils;
import xyz.nova.dto.AttachmentUpload;
import xyz.nova.service.file.AttachmentProxy;
import xyz.nova.utils.R;

import java.util.List;

@AllArgsConstructor
@RestMappingController("nova/attachment")
public class AttachmentController {

    private AttachmentProxy attachmentProxy;

    @Comment("上传文件")
    @PostMapping("upload")
    @NovaRouter
    public R<List<String>> upload(@ModelAttribute @Validated AttachmentUpload attachmentUpload) {
        return NovaFeignUtils.upload(attachmentUpload.getNovaName(), "/nova/attachment/upload", attachmentUpload.getFiles(), () -> {
            xyz.nova.controller.AttachmentController attachmentController = new xyz.nova.controller.AttachmentController(attachmentProxy);
            return attachmentController.upload(attachmentUpload);
        });
    }

}