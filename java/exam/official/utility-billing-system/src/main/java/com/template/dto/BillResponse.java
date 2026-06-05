package com.template.dto;

import com.template.entity.BillStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponse {
    private UUID id;
    private String billNumber;
    private UUID customerId;
    private String customerNationalId;
    private String customerName;
    private String customerNumber;
    private UUID meterId;
    private String meterNumber;
    private String billingMonth;
    private BigDecimal consumption;
    private BigDecimal unitPrice;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal balance;
    private BillStatus status;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
