package xyz.nova;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import xyz.nova.annotation.config.NovaScan;

@NovaScan
@SpringBootApplication
public class Start {

    public static void main(String[] args) {
        SpringApplication.run(Start.class, args);
    }

}
