package com.microservices.auth.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enable scheduling for cleanup tasks
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
