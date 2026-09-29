package xyz.nova.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "nova")
public class NovaAiConfig {

    /**
     * 大模型配置列表
     */
    private Map<String, OpenAiConfig> openAis = new LinkedHashMap<>();

    @Data
    public static class OpenAiConfig {

        /**
         * 大模型的baseUrl
         */
        private String baseUrl;

        /**
         * 认证的API key
         */
        private String apiKey;

        /**
         * 要使用的模型名称
         */
        private String model;
    }


}
