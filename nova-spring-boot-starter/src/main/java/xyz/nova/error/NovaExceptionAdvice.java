package xyz.nova.error;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import xyz.nova.constant.NovaConst;
import xyz.nova.i18n.NovaI18nUtils;
import xyz.nova.utils.R;

@Slf4j
@AllArgsConstructor
@RestControllerAdvice({NovaConst.CONTROLLER_PACKAGE, NovaConst.CONTROLLER_CLOUD_PACKAGE})
public class NovaExceptionAdvice {

    /**
     * Nova框架异常
     */
    @ExceptionHandler(NovaException.class)
    public R novaException(NovaException e) {
        log.error("{}", e.getDetail(), e);
        return R.fail(e.getMessage());
    }

    /**
     * 全局异常
     */
    @ExceptionHandler(Exception.class)
    public R allException(Exception e) {
        log.error("", e);
        return R.fail(NovaI18nUtils.get("sys.error", NovaI18nUtils.SourceType.CODE));
    }

}
