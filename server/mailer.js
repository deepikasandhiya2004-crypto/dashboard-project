import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to, resetLink) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n[DEV] SMTP not fully configured. Password reset link for ${to}:\n${resetLink}\n`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: "Reset your INFINIQ CRM password",
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      `,
    });
    console.log(`Password reset email sent to ${to}. Message ID: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send password reset email to ${to}:`, err.message);
    throw err;
  }
}