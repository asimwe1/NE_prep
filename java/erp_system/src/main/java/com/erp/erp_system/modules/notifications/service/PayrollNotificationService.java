package com.erp.erp_system.modules.notifications.service;

import com.erp.erp_system.modules.notifications.entity.PayrollNotification;
import com.erp.erp_system.modules.notifications.repository.PayrollNotificationRepository;
import com.erp.erp_system.modules.payroll.entity.Payroll;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PayrollNotificationService {
    private final PayrollNotificationRepository repository;
    private final JavaMailSender mailSender;

    @Value("${app.institution.name}")
    private String institutionName;

    /** Generates, sends, and stores a payroll approval notification. */
    public PayrollNotification notifyPaid(Payroll payroll) {
        if (repository.existsByPayrollId(payroll.getId())) return null;
        String message = message(payroll);
        boolean sent = send(payroll.getEmployee().getEmail(), message);
        PayrollNotification notification = new PayrollNotification();
        notification.setPayroll(payroll);
        notification.setRecipientEmail(payroll.getEmployee().getEmail());
        notification.setMessage(message);
        notification.setSent(sent);
        return repository.save(notification);
    }

    private String message(Payroll payroll) {
        return "Dear " + payroll.getEmployee().getFirstName() + ", Your salary of "
                + payroll.getMonth() + "/" + payroll.getYear() + " from " + institutionName
                + " amounting to " + payroll.getNetSalary() + " has been credited to your "
                + payroll.getEmployee().getCode() + " account successfully.";
    }

    private boolean send(String to, String body) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(to);
            mail.setSubject("Salary credited");
            mail.setText(body);
            mailSender.send(mail);
            return true;
        } catch (MailException ex) {
            return false;
        }
    }
}
