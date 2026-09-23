package xyz.nova.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "nova.open-ai")
public class NovaAiConfig {

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
