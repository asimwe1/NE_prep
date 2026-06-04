package com.microservices.common.util;

import org.apache.commons.lang3.StringUtils;

import java.util.Collection;
import java.util.regex.Pattern;

/**
 * Utility class for string operations
 */
public final class StringUtil {
    
    private StringUtil() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }
    
    private static final Pattern EMAIL_PATTERN = 
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    
    /**
     * Check if string is null or empty
     */
    public static boolean isEmpty(String str) {
        return StringUtils.isEmpty(str);
    }
    
    /**
     * Check if string is not null and not empty
     */
    public static boolean isNotEmpty(String str) {
        return StringUtils.isNotEmpty(str);
    }
    
    /**
     * Check if string is blank (null, empty, or whitespace)
     */
    public static boolean isBlank(String str) {
        return StringUtils.isBlank(str);
    }
    
    /**
     * Check if string is not blank
     */
    public static boolean isNotBlank(String str) {
        return StringUtils.isNotBlank(str);
    }
    
    /**
     * Validate email format
     */
    public static boolean isValidEmail(String email) {
        return isNotBlank(email) && EMAIL_PATTERN.matcher(email).matches();
    }
    
    /**
     * Capitalize first letter
     */
    public static String capitalize(String str) {
        return StringUtils.capitalize(str);
    }
    
    /**
     * Convert to lowercase
     */
    public static String toLowerCase(String str) {
        return str != null ? str.toLowerCase() : null;
    }
    
    /**
     * Convert to uppercase
     */
    public static String toUpperCase(String str) {
        return str != null ? str.toUpperCase() : null;
    }
    
    /**
     * Trim string
     */
    public static String trim(String str) {
        return StringUtils.trim(str);
    }
    
    /**
     * Join collection with delimiter
     */
    public static String join(Collection<?> collection, String delimiter) {
        return StringUtils.join(collection, delimiter);
    }
}
