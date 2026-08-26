import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null; // not configured — caller decides how to handle this
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT) || 587,
      secure: Number(env.SMTP_PORT) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends a "time to take your medicine" reminder email.
 * Silently no-ops (with a console warning) if SMTP isn't configured,
 * so a missing .env setting never crashes the reminder scheduler.
 *
 * @returns {Promise<boolean>} true if the email was actually sent
 */
export async function sendReminderEmail({ to, userName, medicineName, dosage, time }) {
  const t = getTransporter();
  if (!t) {
    console.warn(
      "[Email] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — skipping reminder email."
    );
    return false;
  }

  const dosageLine = dosage ? ` (${dosage})` : "";

  try {
    await t.sendMail({
      from: env.EMAIL_FROM || `MedAssist <${env.SMTP_USER}>`,
      to,
      subject: `Reminder: take ${medicineName}${dosageLine}`,
      text: `Hi ${userName || "there"},\n\nIt's ${time} — time to take your ${medicineName}${dosageLine}.\n\nOpen MedAssist to mark this dose as taken.\n\n— MedAssist`,
      html: `
        <div style="font-family: sans-serif; color: #0F1E3A;">
          <h2 style="margin-bottom: 4px;">Time to take your medicine</h2>
          <p>Hi ${userName || "there"},</p>
          <p>It's <strong>${time}</strong> — time to take <strong>${medicineName}${dosageLine}</strong>.</p>
          <p style="color: #64748B; font-size: 13px; margin-top: 24px;">
            Sent automatically by MedAssist. Open the app to mark this dose as taken.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error(`[Email] Failed to send reminder email: ${err.message}`);
    return false;
  }
}

export default { sendReminderEmail };
