package com.neosentinel.mission;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class MissionControlApplication {
    public static void main(String[] args) {
        SpringApplication.run(MissionControlApplication.class, args);
    }
}