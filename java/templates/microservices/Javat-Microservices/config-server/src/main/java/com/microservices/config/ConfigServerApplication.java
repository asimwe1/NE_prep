package com.microservices.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.config.server.EnableConfigServer;

/**
 * Spring Cloud Config Server
 * 
 * Centralized configuration management for all microservices.
 * Configurations are stored in the config-repo directory (Git backend can be configured).
 * 
 * Access configurations: http://localhost:8888/{application}/{profile}
 * Example: http://localhost:8888/user-service/dev
 */
@SpringBootApplication
@EnableConfigServer
@EnableDiscoveryClient
public class ConfigServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
