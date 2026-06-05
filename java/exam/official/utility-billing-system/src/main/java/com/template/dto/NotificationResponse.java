package com.template.dto;

import com.template.entity.NotificationStatus;
import com.template.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private UUID customerId;
    private String customerName;
    private NotificationType type;
    private NotificationStatus status;
    private String recipient;
    private String subject;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
}
