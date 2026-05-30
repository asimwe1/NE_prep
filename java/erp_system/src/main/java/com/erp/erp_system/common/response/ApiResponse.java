package com.erp.erp_system.common.response;

import java.util.List;

public record ApiResponse<T>(boolean success, String message, T data, List<String> errors) {

    /** Builds a successful response envelope. */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, List.of());
    }

    /** Builds an error response envelope. */
    public static <T> ApiResponse<T> error(String message, List<String> errors) {
        return new ApiResponse<>(false, message, null, errors);
    }
}
