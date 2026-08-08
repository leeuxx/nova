package xyz.nova.controller;

import xyz.nova.annotation.NovaRouter;
import xyz.nova.annotation.comment.Comment;
import xyz.nova.annotation.config.RestMappingController;
import xyz.nova.dto.AttachmentUpload;
import xyz.nova.error.NovaException;
import xyz.nova.service.file.AttachmentProxy;
import xyz.nova.utils.R;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@AllArgsConstructor
@RestMappingController("nova/attachment")
public class AttachmentController {

    private AttachmentProxy attachmentProxy;

    @Comment("上传文件")
    @PostMapping("upload")
    @NovaRouter
    public R<List<String>> upload(@ModelAttribute @Validated AttachmentUpload attachmentUpload) {
        List<MultipartFile> files = attachmentUpload.getFiles();
        List<String> paths = files.stream()
                .filter(file -> !file.isEmpty())
                .map(file -> {
                    try (InputStream inputStream = file.getInputStream()) {
                        return attachmentProxy.upLoad(attachmentUpload.getNovaName(), inputStream);
                    } catch (IOException e) {
                        log.error("文件上传失败: {}", file.getOriginalFilename(), e);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (paths.isEmpty()) {
            throw new NovaException("文件上传失败");
        }
        return R.ok(paths);
    }

}
