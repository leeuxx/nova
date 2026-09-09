package xyz.nova.cloud.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class NovaRestTemplateConfig {

    @LoadBalanced
    @Bean("novaRestTemplate")
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
