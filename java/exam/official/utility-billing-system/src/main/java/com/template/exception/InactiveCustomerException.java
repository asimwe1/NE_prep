package com.template.exception;

public class InactiveCustomerException extends RuntimeException {
    public InactiveCustomerException(String customerNumber) {
        super("Customer '" + customerNumber + "' is inactive and cannot be used for billing");
    }
}
