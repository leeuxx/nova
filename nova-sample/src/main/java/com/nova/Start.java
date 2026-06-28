package com.nova;

import com.nova.annotation.config.NovaScan;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@NovaScan
@SpringBootApplication
public class Start {

    public static void main(String[] args) {
        SpringApplication.run(Start.class, args);
    }

    // 对象引用：把对方id放入我
    // 级联新增对象：把我id放入对方
    // 级联新增集合：把我id放入多条对方
    // 集合引用：中间表放入我和对方的id
}
