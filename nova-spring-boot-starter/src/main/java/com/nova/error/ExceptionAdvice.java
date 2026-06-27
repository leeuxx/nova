package com.nova.error;

import com.nova.utils.R;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.StringJoiner;

@Slf4j
@AllArgsConstructor
@RestControllerAdvice
public class ExceptionAdvice {

    /**
     * 全局异常
     */
    @ExceptionHandler(Exception.class)
    public R<Object> allException(Exception e) {
        log.error("", e);
        return R.fail(e.getMessage());
    }

    /**
     * validated校验异常 post
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<Object> methodArgumentNotValidException(MethodArgumentNotValidException e) {
        StringJoiner joiner = new StringJoiner(",");
        List<ObjectError> allErrors = e.getBindingResult().getAllErrors();
        allErrors.forEach(objectError -> joiner.add(objectError.getDefaultMessage()));
        return R.fail(joiner.toString());
    }

}
