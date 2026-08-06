package com.nova.error;

import com.nova.utils.R;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@AllArgsConstructor
@RestControllerAdvice
public class NovaExceptionAdvice {

    /**
     * Nova框架异常
     */
    @ExceptionHandler(NovaException.class)
    public R novaException(NovaException e) {
        log.error("", e);
        return R.fail(e.getMessage());
    }

    /**
     * 全局异常
     */
    @ExceptionHandler(Exception.class)
    public R allException(Exception e) {
        log.error("", e);
        return R.fail(e.getMessage());
    }
}
