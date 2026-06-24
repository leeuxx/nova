package com.nova.controller;

import com.nova.annotation.config.RestMappingController;
import com.nova.dto.AttachmentUpload;
import com.nova.service.AttachmentService;
import com.nova.utils.R;
import lombok.AllArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@AllArgsConstructor
@RestMappingController("nova/attachment")
public class AttachmentController {

    private AttachmentService attachmentService;

    @PostMapping("upload")
    public R<List<String>> upload(@ModelAttribute @Validated AttachmentUpload attachmentUpload) {
        return attachmentService.upload(attachmentUpload);
    }

}
