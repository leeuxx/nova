package com.nova.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.nova.mapper")
public class NovaMybatisConfiguration {
}
