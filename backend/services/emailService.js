import { BrevoClient } from "@getbrevo/brevo";
import { env } from "../config/env.js";

const brevo = new BrevoClient({
  apiKey: env.BREVO_API_KEY,
  timeoutInSeconds: 15,
  maxRetries: 2,
});

export async function sendReminderEmail({
  to,
  userName,
  medicineName,
  dosage,
  time,
}) {
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    console.warn("[Email] Brevo is not configured.");
    return false;
  }

  const dosageLine = dosage ? ` (${dosage})` : "";

  try {
    const result =
      await brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: env.BREVO_SENDER_NAME || "MedAssist Team",
          email: env.BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: to,
            name: userName || "MedAssist User",
          },
        ],
        subject: `Reminder: take ${medicineName}${dosageLine}`,
        textContent: `Hi ${userName || "there"},

It's ${time} — time to take your ${medicineName}${dosageLine}.

Open MedAssist to mark this dose as taken.

— MedAssist Team`,
        htmlContent: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 24px;
          ">
            <h2 style="color:#0f766e;">MedAssist</h2>

            <p>Hi ${userName || "there"},</p>

            <p>
              It's <strong>${time}</strong> —
              time to take your medication.
            </p>

            <div style="
              background:#f0fdfa;
              padding:20px;
              border-radius:12px;
              margin:20px 0;
            ">
              <h3 style="margin-top:0;">
                ${medicineName}
              </h3>

              ${
                dosage
                  ? `<p>Dosage: <strong>${dosage}</strong></p>`
                  : ""
              }

              <p>
                Scheduled time:
                <strong>${time}</strong>
              </p>
            </div>

            <p>
              Open MedAssist to mark this dose as taken.
            </p>

            <hr />

            <p style="color:#94a3b8;font-size:12px;">
              This is an automated reminder from MedAssist.
            </p>

            <p style="color:#94a3b8;font-size:12px;">
              — MedAssist Team
            </p>
          </div>
        `,
      });

    console.log(
      `[Email] Reminder sent successfully via Brevo. Message ID: ${result.messageId}`
    );

    return true;
  } catch (error) {
    console.error(`[Email] Brevo failed: ${error.message}`);
    return false;
  }
}