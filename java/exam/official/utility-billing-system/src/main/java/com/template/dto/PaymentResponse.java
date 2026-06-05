package com.template.dto;

import com.template.entity.BillStatus;
import com.template.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private String paymentReference;
    private UUID billId;
    private String billNumber;
    private UUID customerId;
    private String customerName;
    private BigDecimal amount;
    private String paymentMethod;
    private PaymentStatus status;
    private BigDecimal billBalance;
    private BillStatus billStatus;
    private LocalDateTime paidAt;
}
