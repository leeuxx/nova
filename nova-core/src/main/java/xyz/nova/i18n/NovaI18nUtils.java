package xyz.nova.i18n;

import lombok.NonNull;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;
import xyz.nova.annotation.comment.Comment;

import java.util.Locale;

@Component
public class NovaI18nUtils implements ApplicationContextAware {

    private static MessageSource codeMessageSource;

    private static MessageSource annotateMessageSource;

    /**
     * 获取国际化消息
     */
    public static String get(String key, SourceType sourceType) {
        return get(key, LocaleContextHolder.getLocale(), sourceType, (Object) null);
    }

    /**
     * 获取国际化消息
     */
    public static String get(String key, SourceType sourceType, Object... args) {
        return get(key, LocaleContextHolder.getLocale(), sourceType, args);
    }

    /**
     * 获取国际化消息
     */
    public static String get(String key, Locale locale, SourceType sourceType, Object... args) {
        if (key == null || key.isEmpty()) {
            return key;
        }
        try {
            MessageSource messageSource = sourceType == SourceType.CODE ? codeMessageSource : annotateMessageSource;
            return messageSource.getMessage(key, args, locale);
        } catch (Exception e) {
            return key;
        }
    }

    @Override
    public void setApplicationContext(@NonNull ApplicationContext applicationContext) throws BeansException {
        codeMessageSource = applicationContext.getBean("novaCodeMessageSource", MessageSource.class);
        annotateMessageSource = applicationContext.getBean("novaAnnotateMessageSource", MessageSource.class);
    }

    public enum SourceType {
        @Comment("代码层 nova_code.properties")
        CODE,
        @Comment("注解层 nova_messages.properties")
        ANNOTATE
    }

}
