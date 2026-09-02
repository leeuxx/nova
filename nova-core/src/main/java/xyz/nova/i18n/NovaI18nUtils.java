package xyz.nova.i18n;

import lombok.NonNull;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class NovaI18nUtils implements ApplicationContextAware {

    private static MessageSource messageSource;

    @Override
    public void setApplicationContext(@NonNull ApplicationContext applicationContext) throws BeansException {
        messageSource = applicationContext.getBean("novaMessageSource", MessageSource.class);
    }

    /**
     * 获取国际化消息
     */
    public static String get(String key) {
        return get(key, LocaleContextHolder.getLocale(), (Object) null);
    }

    /**
     * 获取国际化消息
     */
    public static String get(String key, Object... args) {
        return get(key, LocaleContextHolder.getLocale(), args);
    }

    /**
     * 获取国际化消息
     */
    public static String get(String key, Locale locale, Object... args) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (Exception e) {
            return key;
        }
    }

}
