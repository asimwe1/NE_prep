package com.template.service;

import com.template.dto.NotificationResponse;
import com.template.entity.*;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.CustomerNotificationRepository;
import com.template.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.time.YearMonth;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final CustomerNotificationRepository notificationRepository;
    private final CustomerRepository customerRepository;
    private final EmailService emailService;

    /**
     * Persists the notification before sending email so the audit trail remains
     * even when SMTP delivery fails.
     */
    @Transactional
    public void notifyBillGenerated(Bill bill) {
        Customer customer = bill.getCustomer();
        String billingMonth = YearMonth.from(bill.getBillingMonth()).toString();
        String subject = "Utility Bill Generated – " + billingMonth;
        String message = String.format(
                "Dear %s, Your %s utility bill of %s FRW has been successfully processed.",
                customer.getFullName(), billingMonth, bill.getAmount());

        CustomerNotification notification = CustomerNotification.builder()
                .customer(customer)
                .type(NotificationType.BILL_GENERATED)
                .status(NotificationStatus.PENDING)
                .recipient(customer.getEmail())
                .subject(subject)
                .message(message)
                .build();
        CustomerNotification saved = notificationRepository.save(notification);

        try {
            Context ctx = new Context();
            ctx.setVariable("customerName", customer.getFullName());
            ctx.setVariable("billingMonth", billingMonth);
            ctx.setVariable("amount", bill.getAmount());
            ctx.setVariable("billNumber", bill.getBillNumber());
            ctx.setVariable("dueDate", bill.getDueDate());
            emailService.sendCustomEmail(customer.getEmail(), subject, "email/bill-generated", ctx);
            saved.setStatus(NotificationStatus.SENT);
        } catch (Exception e) {
            log.warn("Failed to send bill-generated email to {}: {}", customer.getEmail(), e.getMessage());
            saved.setStatus(NotificationStatus.FAILED);
        }
        notificationRepository.save(saved);
    }

    /**
     * Sends the full-payment notification after PaymentService transitions the bill to PAID.
     */
    @Transactional
    public void notifyPaymentReceived(Bill bill) {
        Customer customer = bill.getCustomer();
        String billingMonth = YearMonth.from(bill.getBillingMonth()).toString();
        String subject = "Payment Received – Bill " + bill.getBillNumber();
        String message = String.format(
                "Dear %s, Your payment for %s utility bill %s of %s FRW has been received. Your account is now fully settled.",
                customer.getFullName(), billingMonth, bill.getBillNumber(), bill.getAmount());

        CustomerNotification notification = CustomerNotification.builder()
                .customer(customer)
                .type(NotificationType.PAYMENT_RECEIVED)
                .status(NotificationStatus.PENDING)
                .recipient(customer.getEmail())
                .subject(subject)
                .message(message)
                .build();
        CustomerNotification saved = notificationRepository.save(notification);

        try {
            Context ctx = new Context();
            ctx.setVariable("customerName", customer.getFullName());
            ctx.setVariable("billingMonth", billingMonth);
            ctx.setVariable("amount", bill.getAmount());
            ctx.setVariable("billNumber", bill.getBillNumber());
            ctx.setVariable("paidAmount", bill.getPaidAmount());
            emailService.sendCustomEmail(customer.getEmail(), subject, "email/payment-received", ctx);
            saved.setStatus(NotificationStatus.SENT);
        } catch (Exception e) {
            log.warn("Failed to send payment-received email to {}: {}", customer.getEmail(), e.getMessage());
            saved.setStatus(NotificationStatus.FAILED);
        }
        notificationRepository.save(saved);
    }

    public Page<NotificationResponse> listAll(Pageable pageable) {
        return notificationRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<NotificationResponse> listByCustomer(UUID customerId, Pageable pageable) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        return notificationRepository.findByCustomerOrderByCreatedAtDesc(customer, pageable)
                .map(this::toResponse);
    }

    private NotificationResponse toResponse(CustomerNotification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .customerId(n.getCustomer().getId())
                .customerName(n.getCustomer().getFullName())
                .type(n.getType())
                .status(n.getStatus())
                .recipient(n.getRecipient())
                .subject(n.getSubject())
                .message(n.getMessage())
                .createdAt(n.getCreatedAt())
                .sentAt(n.getSentAt())
                .build();
    }
}
