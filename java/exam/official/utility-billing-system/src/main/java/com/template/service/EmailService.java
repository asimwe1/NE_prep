package com.template.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.email.from}")
    private String from;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.email.base-url}")
    private String baseUrl;

    @Value("${app.email.delivery:log}")
    private String deliveryMode;

    @Async
    public void sendVerificationEmail(String toEmail, String firstName, String token) {
        String verificationUrl = baseUrl + "/api/v1/auth/verify-email?token=" + token;
        Context ctx = new Context();
        ctx.setVariable("name", firstName);
        ctx.setVariable("verificationUrl", verificationUrl);
        ctx.setVariable("appName", fromName);

        sendHtmlEmail(toEmail, "Verify Your Email Address", "email/verification", ctx, verificationUrl);
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String firstName, String token) {
        String resetUrl = buildPasswordResetUrl(token);
        Context ctx = new Context();
        ctx.setVariable("name", firstName);
        ctx.setVariable("resetUrl", resetUrl);
        ctx.setVariable("appName", fromName);
        ctx.setVariable("expiryMinutes", 60);

        sendHtmlEmail(toEmail, "Reset Your Password", "email/password-reset", ctx, resetUrl);
    }

    public String buildPasswordResetUrl(String token) {
        return baseUrl + "/api/v1/auth/reset-password?token=" + token;
    }

    public boolean isLogMode() {
        return "log".equalsIgnoreCase(deliveryMode);
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        Context ctx = new Context();
        ctx.setVariable("name", firstName);
        ctx.setVariable("appName", fromName);
        ctx.setVariable("loginUrl", baseUrl + "/login");

        sendHtmlEmail(toEmail, "Welcome to " + fromName + "!", "email/welcome", ctx, baseUrl + "/login");
    }

    @Async
    public void sendPasswordChangedEmail(String toEmail, String firstName) {
        Context ctx = new Context();
        ctx.setVariable("name", firstName);
        ctx.setVariable("appName", fromName);
        ctx.setVariable("supportEmail", from);

        sendHtmlEmail(toEmail, "Your Password Has Been Changed", "email/password-changed", ctx, null);
    }

    @Async
    public void sendCustomEmail(String toEmail, String subject, String templateName, Context ctx) {
        sendHtmlEmail(toEmail, subject, templateName, ctx, null);
    }

    private void sendHtmlEmail(String to, String subject, String template, Context ctx, String actionUrl) {
        if ("log".equalsIgnoreCase(deliveryMode)) {
            log.info("Email delivery is in log mode. subject='{}', to='{}', actionUrl='{}'", subject, to, actionUrl);
            return;
        }

        try {
            String html = templateEngine.process(template, ctx);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email '{}' sent to {}", subject, to);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
