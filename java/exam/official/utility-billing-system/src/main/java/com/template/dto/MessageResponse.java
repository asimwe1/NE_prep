package com.template.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MessageResponse {
    private String message;
    private boolean success;
    private String actionUrl;

    public MessageResponse(String message, boolean success) {
        this.message = message;
        this.success = success;
    }

    public static MessageResponse of(String message) {
        return new MessageResponse(message, true);
    }

    public static MessageResponse withActionUrl(String message, String actionUrl) {
        return new MessageResponse(message, true, actionUrl);
    }

    public static MessageResponse error(String message) {
        return new MessageResponse(message, false);
    }
}
