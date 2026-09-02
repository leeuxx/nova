package xyz.nova.i18n;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.nio.charset.StandardCharsets;

@Configuration
public class NovaI18nAutoConfiguration {

    /**
     * 框架自己的MessageSource（代码层）
     */
    @Bean("novaCodeMessageSource")
    public MessageSource novaCodeMessageSource() {
        // 加载 classpath:i18n/nova_code_zh.properties 等语言文件
        return getResourceBundleMessageSource("i18n/nova_code");
    }

    /**
     * 框架自己的MessageSource（注解层）
     */
    @Bean("novaAnnotateMessageSource")
    public MessageSource novaAnnotateMessageSource() {
        // 加载 classpath:i18n/nova_messages_zh.properties 等语言文件
        return getResourceBundleMessageSource("i18n/nova_messages");
    }

    private ResourceBundleMessageSource getResourceBundleMessageSource(String basename) {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        // 1. 指定资源文件基础名
        source.setBasename(basename);
        // 2. 字符编码（必须 UTF-8）
        source.setDefaultEncoding(StandardCharsets.UTF_8.name());
        // 3. 找不到 key 时，返回 key 本身（不抛异常）
        //    配合 FallbackToSystemLocale(false)，未匹配的语言也返回 key
        source.setUseCodeAsDefaultMessage(true);
        // 4. 缓存时间（秒），-1 表示永久缓存
        source.setCacheSeconds(-1);
        // 5. 找不到对应语言文件时，不回退到系统语言
        //    避免依赖服务器系统语言导致行为不可控
        source.setFallbackToSystemLocale(false);
        return source;
    }

}
