package com.template.service;

import com.template.dto.PaymentRequest;
import com.template.dto.PaymentResponse;
import com.template.entity.*;
import com.template.exception.OverpaymentException;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BillService billService;
    private final NotificationService notificationService;

    /**
     * Records a partial or full payment and updates the bill in the same transaction.
     * Full payment is the only point where the payment notification is emitted.
     */
    @Transactional
    public PaymentResponse recordPayment(PaymentRequest request) {
        Bill bill = billService.findOrThrow(request.getBillId());

        if (bill.getStatus() == BillStatus.PAID) {
            throw new IllegalStateException(
                    "Bill '" + bill.getBillNumber() + "' is already fully paid");
        }

        if (paymentRepository.existsByPaymentReference(request.getPaymentReference())) {
            throw new IllegalArgumentException(
                    "Payment reference '" + request.getPaymentReference() + "' already exists");
        }

        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal balance = bill.getBalance();

        if (amount.compareTo(balance) > 0) {
            throw new OverpaymentException(amount, balance);
        }

        bill.setPaidAmount(bill.getPaidAmount().add(amount));
        bill.setBalance(balance.subtract(amount));

        boolean fullPaid = bill.getBalance().compareTo(BigDecimal.ZERO) == 0;
        bill.setStatus(fullPaid ? BillStatus.PAID : BillStatus.PARTIALLY_PAID);

        Payment payment = Payment.builder()
                .paymentReference(request.getPaymentReference().trim().toUpperCase())
                .bill(bill)
                .amount(amount)
                .paymentMethod(request.getPaymentMethod().trim())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        if (fullPaid) {
            notificationService.notifyPaymentReceived(bill);
        }

        return toResponse(savedPayment);
    }

    public Page<PaymentResponse> listPayments(Pageable pageable) {
        return paymentRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<PaymentResponse> getPaymentsByBill(UUID billId, Pageable pageable) {
        Bill bill = billService.findOrThrow(billId);
        return paymentRepository.findByBill(bill, pageable).map(this::toResponse);
    }

    private PaymentResponse toResponse(Payment p) {
        Bill bill = p.getBill();
        return PaymentResponse.builder()
                .id(p.getId())
                .paymentReference(p.getPaymentReference())
                .billId(bill.getId())
                .billNumber(bill.getBillNumber())
                .customerId(bill.getCustomer().getId())
                .customerName(bill.getCustomer().getFullName())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .status(p.getStatus())
                .billBalance(bill.getBalance())
                .billStatus(bill.getStatus())
                .paidAt(p.getPaidAt())
                .build();
    }
}
