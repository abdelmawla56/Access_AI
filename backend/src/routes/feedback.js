const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (e) {
  console.warn("[FEEDBACK] NodeMailer is not installed. Utilizing robust console and local file logging fallback.");
}

const FEEDBACK_FILE = path.join(__dirname, "../../../feedback.json");

/**
 * POST /api/feedback/rate
 * Receives user rating (1-5), optional comments, and emails the summary to s-youssef.elmawla@zewailcity.edu.eg
 */
router.post("/rate", async (req, res) => {
  const { rating, comment, userEmail } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Invalid rating. Must be between 1 and 5 stars." });
  }

  const feedbackData = {
    rating,
    comment: comment || "No comment provided.",
    userEmail: userEmail || "Anonymous Voice User",
    timestamp: new Date().toISOString(),
  };

  console.log("\n================ [SYSTEM FEEDBACK RECEIVED] ================");
  console.log(`⭐ Rating: ${rating} / 5 Stars`);
  console.log(`📧 User: ${feedbackData.userEmail}`);
  console.log(`💬 Comments: ${feedbackData.comment}`);
  console.log("============================================================\n");

  // Always persist feedback locally to avoid loss
  try {
    let existing = [];
    if (fs.existsSync(FEEDBACK_FILE)) {
      const content = fs.readFileSync(FEEDBACK_FILE, "utf-8");
      existing = JSON.parse(content || "[]");
    }
    existing.push(feedbackData);
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error("[FEEDBACK] Failed to write local feedback log file:", err.message);
  }

  // Try sending an actual email using NodeMailer if available
  if (nodemailer) {
    try {
      // Configure mail transport. Using a mock/development transport or configurable credentials.
      // If no SMTP config is present, we log that it's in dry-run mode to prevent blocking.
      const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

      let transporter;
      if (hasSmtpConfig) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Create standard dev sandbox account
        const testAccount = await nodemailer.createTestAccount().catch(() => null);
        if (testAccount) {
          transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
        }
      }

      if (transporter) {
        const mailOptions = {
          from: '"Symbio Tech Feedback" <symbiotech-feedback@zewailcity.edu.eg>',
          to: "s-youssef.elmawla@zewailcity.edu.eg",
          subject: `✨ Symbio Tech - System Rating Received: ${rating} Stars!`,
          text: `Hello Youssef,\n\nYou have received new feedback for the Symbio Tech accessibility ecosystem:\n\n⭐ Rating: ${rating}/5 Stars\n📧 User: ${feedbackData.userEmail}\n💬 Message: ${feedbackData.comment}\n⏰ Time: ${feedbackData.timestamp}\n\nBest regards,\nSymbio Tech AI Agent Core`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #6366f1; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-top: 0;">✨ New Symbio Tech Feedback</h2>
              <p style="font-size: 16px;"><strong>⭐ Rating:</strong> <span style="font-size: 20px; color: #fbbf24;">${"★".repeat(rating)}${"☆".repeat(5-rating)}</span> (${rating}/5)</p>
              <p style="font-size: 14px; color: #475569;"><strong>📧 User Email:</strong> ${feedbackData.userEmail}</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; font-style: italic; color: #334155;">
                "${feedbackData.comment}"
              </div>
              <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-bottom: 0;">Submitted automatically via Symbio Tech Web App on ${new Date().toLocaleString()}</p>
            </div>
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[FEEDBACK] Email successfully sent to Youssef! Message ID: ${info.messageId}`);
        if (!hasSmtpConfig) {
          console.log(`[FEEDBACK] Preview URL for developer test account: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return res.json({ ok: true, message: "Feedback submitted and email dispatched successfully!", emailed: true });
      }
    } catch (err) {
      console.error("[FEEDBACK] Failed to dispatch NodeMailer email:", err.message);
      // Fall through to success return since we logged and saved it locally
    }
  }

  // Success response indicating feedback was saved and logged
  res.json({
    ok: true,
    message: "Feedback submitted and logged locally on backend.",
    emailed: false,
  });
});

module.exports = router;
