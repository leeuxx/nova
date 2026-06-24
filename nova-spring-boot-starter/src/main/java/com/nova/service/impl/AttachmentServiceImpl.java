package com.nova.service.impl;

import com.nova.annotation.fun.AttachmentProxy;
import com.nova.dto.AttachmentUpload;
import com.nova.service.AttachmentService;
import com.nova.utils.R;
import com.nova.utils.SpringBeanUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    @Override
    public R<List<String>> upload(AttachmentUpload attachmentUpload) {
        List<MultipartFile> files = attachmentUpload.getFiles();
        AttachmentProxy attachmentProxy = SpringBeanUtils.getBean(AttachmentProxy.class);
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
            throw new RuntimeException("文件上传失败");
        }
        return R.ok(paths);
    }
}
