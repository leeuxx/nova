package xyz.nova.i18n;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.nio.charset.StandardCharsets;

@Configuration
public class NovaI18nAutoConfiguration {

    /**
     * 框架自己的 MessageSource Bean
     */
    @Bean("novaMessageSource")
    public MessageSource novaMessageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        // 1. 指定资源文件基础名（框架自己的文件）
        // 会加载 classpath:i18n/nova-messages.properties, 以及 classpath:i18n/nova-messages_zh.properties 等
        source.setBasename("i18n/nova-messages");
        // 2. 字符编码（必须 UTF-8）
        source.setDefaultEncoding(StandardCharsets.UTF_8.name());
        // 3. 如果找不到 key，返回 ???key??? 格式，方便调试
        source.setUseCodeAsDefaultMessage(true);
        // 4. 缓存时间（秒），-1 表示永久缓存，热部署时可以设为 5 秒
        source.setCacheSeconds(-1);
        // 5. 如果找不到资源文件，不抛异常，返回 null
        source.setFallbackToSystemLocale(false);
        return source;
    }

}
