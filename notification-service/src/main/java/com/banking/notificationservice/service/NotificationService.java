package com.banking.notificationservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @KafkaListener(topics = "transaction.completed")
    public void consumeTransactionCompleted(
            @Payload Map<String, Object> payload) {
        try {
            String senderAccount = (String) payload.get("senderAccountNumber");
            String receiverAccount = (String) payload.get("receiverAccountNumber");
            String amount = payload.get("amount").toString();

            // Notify Sender
            String senderTarget = payload.containsKey("senderEmail") ? (String) payload.get("senderEmail") : senderAccount;
            sendAlert(senderTarget, senderAccount,
                    "DEBIT ALERT",
                    String.format(
                            "₹%s debited from your account %s. " +
                                    "Transferred to %s.",
                            amount, senderAccount, receiverAccount));

            // Notify Receiver
            String receiverTarget = payload.containsKey("receiverEmail") ? (String) payload.get("receiverEmail") : receiverAccount;
            sendAlert(receiverTarget, receiverAccount,
                    "CREDIT ALERT",
                    String.format(
                            "₹%s credited to your account %s. " +
                                    "Received from %s.",
                            amount, receiverAccount, senderAccount));

        } catch (Exception e) {
            log.error("Error sending transaction notifications: {}",
                    e.getMessage());
        }
    }


    @KafkaListener(topics = "fraud.detected")
    public void consumeFraudDetected(
            @Payload Map<String, Object> payload) {
        try {
            String accountNumber = (String) payload.get("accountNumber");
            String reason = (String) payload.get("reason");
            String target = payload.containsKey("email") ? (String) payload.get("email") : accountNumber;

            sendAlert(target, accountNumber,
                    "🚨 ACCOUNT BLOCKED",
                    String.format(
                            "Your account %s has been blocked. " +
                                    "Reason: %s. " +
                                    "Please contact your bank immediately.",
                            accountNumber, reason));

        } catch (Exception e) {
            log.error("Error sending fraud alert: {}", e.getMessage());
        }
    }


    @KafkaListener(topics = "transaction.otp.generated")
    public void consumeOtpGenerated(
            @Payload Map<String, Object> payload) {
        try {
            String accountNumber = (String) payload.get("accountNumber");
            String otp = (String) payload.get("otp");
            String transactionId = (String) payload.get("transactionId");
            String amount = payload.get("amount").toString();
            String reason = (String) payload.get("reason");
            String target = payload.containsKey("email") ? (String) payload.get("email") : accountNumber;

            sendAlert(target, accountNumber,
                    "🔐 TRANSACTION VERIFICATION REQUIRED",
                    String.format(
                            "Suspicious activity detected on your account. " +
                                    "Reason: %s. " +
                                    "A transaction of ₹%s is pending verification. " +
                                    "Your OTP is: %s. Valid for 5 minutes. " +
                                    "If this wasn't you — ignore this message. " +
                                    "Transaction will be cancelled and amount refunded automatically.",
                            reason, amount, otp, transactionId, otp));

        } catch (Exception e) {
            log.error("Error sending OTP notification: {}",
                    e.getMessage());
        }
    }

    @KafkaListener(topics = "auth.password.reset.otp")
    public void consumePasswordResetOtp(
            @Payload Map<String, Object> payload) {
        try {
            String email = (String) payload.get("email");
            String otp = (String) payload.get("otp");

            sendAlert(email, email, "🔑 PASSWORD RESET OTP CODE",
                    String.format(
                            "Hello,\n\nYour 6-digit OTP code to reset your Apex Bank password is: %s\n\nThis OTP is valid for 15 minutes. Do not share this code with anyone.\n\nRegards,\nApex Bank Security Team",
                            otp));
            log.info("📧 Password Reset OTP notification processed for: {}", email);
        } catch (Exception e) {
            log.error("Error sending password reset OTP notification: {}", e.getMessage());
        }
    }


    @KafkaListener(topics = "transaction.refunded")
    public void consumeTransactionRefunded(
            @Payload Map<String, Object> payload) {
        try {
            String senderAccount = (String) payload.get("senderAccountNumber");
            String amount = payload.get("amount").toString();
            String reason = (String) payload.get("reason");
            String target = payload.containsKey("email") ? (String) payload.get("email") : senderAccount;

            sendAlert(target, senderAccount, "💰 REFUND PROCESSED",
                    String.format(
                            "Your transaction of ₹%s was cancelled. " +
                                    "Reason: %s. " +
                                    "₹%s has been refunded to account %s.",
                            amount, reason, amount, senderAccount));

        } catch (Exception e) {
            log.error("Error sending refund notification: {}",
                    e.getMessage());
        }
    }

    /**
     * Payment completed via Razorpay.
     */
    @KafkaListener(topics = "payment.completed")
    public void consumePaymentCompleted(
            @Payload Map<String, Object> payload) {
        try {
            String accountNumber = (String) payload.get("accountNumber");
            String amount = payload.get("amount").toString();
            String email = (String) payload.get("email");
            String target = (email != null && !email.isBlank()) ? email : accountNumber;

            sendAlert(target, accountNumber, "PAYMENT SUCCESSFUL",
                    String.format(
                            "Payment of ₹%s completed. " +
                                    "Razorpay ID: %s",
                            amount, payload.get("razorpayPaymentId")));

        } catch (Exception e) {
            log.error("Error sending payment notification: {}",
                    e.getMessage());
        }
    }

    /**
     * Payment failed via Razorpay.
     */
    @KafkaListener(topics = "payment.failed")
    public void consumePaymentFailed(
            @Payload Map<String, Object> payload) {
        try {
            String accountNumber = (String) payload.get("accountNumber");
            String amount = payload.get("amount").toString();
            String email = (String) payload.get("email");
            String target = (email != null && !email.isBlank()) ? email : accountNumber;

            sendAlert(target, accountNumber, "❌ PAYMENT FAILED",
                    String.format(
                            "Your payment of ₹%s could not be processed. " +
                                    "Please try again or contact support.",
                            amount));

        } catch (Exception e) {
            log.error("Error sending payment failure notification: {}",
                    e.getMessage());
        }
    }

    private void sendAlert(String recipient,
                           String subject,
                           String message) {
        sendAlert(recipient, recipient, subject, message);
    }

    private void sendAlert(String recipient,
                           String accountRef,
                           String subject,
                           String message) {
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("NOTIFICATION ALERT");
        log.info("Recipient  : {}", recipient);
        log.info("AccountRef : {}", accountRef);
        log.info("Subject    : {}", subject);
        log.info("Message    : {}", message);
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        if (mailSender != null && fromEmail != null && !fromEmail.isBlank()) {
            try {
                String targetEmail = (recipient != null && recipient.contains("@")) ? recipient : fromEmail;
                
                jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();
                org.springframework.mail.javamail.MimeMessageHelper helper = 
                        new org.springframework.mail.javamail.MimeMessageHelper(mimeMessage, true, "UTF-8");
                
                helper.setFrom(fromEmail);
                helper.setTo(targetEmail);
                helper.setSubject("🏦 Digital Banking Alert: " + subject);
                
                String htmlContent = buildHtmlEmailTemplate(subject, message, accountRef);
                helper.setText(htmlContent, true);
                
                mailSender.send(mimeMessage);
                log.info("📧 Professional HTML Email alert successfully sent to {}", targetEmail);
            } catch (Exception e) {
                log.error("Failed to send HTML email to {}: {}", recipient, e.getMessage());
            }
        }
    }

    private String buildHtmlEmailTemplate(String subject, String message, String accountRef) {
        String now = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
        
        String badgeColor = "#2563eb"; // default blue
        String displayStatus = "COMPLETED";
        if (subject.contains("DEBIT") || subject.contains("BLOCKED") || subject.contains("FAILED")) {
            badgeColor = "#dc2626"; // red
            displayStatus = subject.contains("BLOCKED") ? "BLOCKED" : (subject.contains("FAILED") ? "FAILED" : "COMPLETED");
        } else if (subject.contains("CREDIT") || subject.contains("SUCCESSFUL")) {
            badgeColor = "#16a34a"; // green
            displayStatus = "COMPLETED";
        } else if (subject.contains("VERIFICATION") || subject.contains("OTP")) {
            badgeColor = "#d97706"; // amber
            displayStatus = "ACTION REQUIRED";
        } else if (subject.contains("REFUND")) {
            badgeColor = "#2563eb";
            displayStatus = "REFUNDED";
        }

        return "<!DOCTYPE html>" +
                "<html>" +
                "<head><meta charset='UTF-8'></head>" +
                "<body style='font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px;'>" +
                "  <table align='center' border='0' cellpadding='0' cellspacing='0' width='600' style='background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);'>" +
                "    <!-- Header -->" +
                "    <tr>" +
                "      <td style='background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 25px; text-align: center; color: #ffffff;'>" +
                "        <h1 style='margin: 0; font-size: 24px; font-weight: bold; tracking-wide;'>🏦 DIGITAL BANKING SYSTEM</h1>" +
                "        <p style='margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;'>Official Account Notification Service</p>" +
                "      </td>" +
                "    </tr>" +
                "    <!-- Body -->" +
                "    <tr>" +
                "      <td style='padding: 30px;'>" +
                "        <div style='display: inline-block; background-color: " + badgeColor + "; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px;'>" +
                "          " + subject +
                "        </div>" +
                "        <p style='font-size: 16px; color: #334155; line-height: 1.6; margin-top: 10px;'>" +
                "          Dear Customer," +
                "        </p>" +
                "        <p style='font-size: 15px; color: #334155; line-height: 1.6; background-color: #f8fafc; border-left: 4px solid " + badgeColor + "; padding: 15px; border-radius: 4px;'>" +
                "          " + message +
                "        </p>" +
                "        <!-- Details Table -->" +
                "        <table width='100%' cellpadding='8' cellspacing='0' style='margin-top: 20px; border-collapse: collapse; border: 1px solid #e2e8f0; font-size: 14px;'>" +
                "          <tr style='background-color: #f1f5f9;'>" +
                "            <td style='color: #64748b; font-weight: bold;'>Account Reference</td>" +
                "            <td style='color: #0f172a; font-weight: bold; text-align: right;'>" + (accountRef != null ? accountRef : "N/A") + "</td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td style='color: #64748b;'>Date & Time</td>" +
                "            <td style='color: #0f172a; text-align: right;'>" + now + "</td>" +
                "          </tr>" +
                "          <tr style='background-color: #f1f5f9;'>" +
                "            <td style='color: #64748b;'>Status</td>" +
                "            <td style='color: " + badgeColor + "; font-weight: bold; text-align: right;'>" + displayStatus + "</td>" +
                "          </tr>" +
                "        </table>" +
                "        <p style='font-size: 13px; color: #64748b; margin-top: 25px; line-height: 1.5;'>" +
                "          🔒 <strong>Security Tip:</strong> Digital Banking System will never ask for your Password, PIN, or CVV over call or email." +
                "        </p>" +
                "      </td>" +
                "    </tr>" +
                "    <!-- Footer -->" +
                "    <tr>" +
                "      <td style='background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;'>" +
                "        <p style='margin: 0;'>If you did not authorize this transaction, please immediately report to <a href='mailto:security@digitalbank.com' style='color: #2563eb;'>security@digitalbank.com</a> or call 1800-BANK-HELP.</p>" +
                "        <p style='margin: 8px 0 0 0;'>&copy; 2026 Digital Banking System Inc. All rights reserved.</p>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>";
    }
}
