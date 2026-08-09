import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export function getSiteUrl(requestOrigin: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;
}

export async function sendOtpEmail(to: string, code: string) {
  if (!transporter) {
    console.warn("SMTP not configured; skipping email send");
    return false;
  }

  const subject = "Your RentTrack payment verification code";
  const text = `Your verification code is: ${code}. It expires in 10 minutes.`;
  const html = `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`;

  try {
    await transporter.sendMail({
      from: SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return false;
  }
}

export function isSmtpConfigured() {
  return !!transporter;
}

export async function sendEmail({ to, subject, text, html, bcc }: { to: string; subject: string; text?: string; html?: string; bcc?: string }) {
  if (!transporter) {
    throw new Error("SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.");
  }

  try {
    await transporter.sendMail({
      from: SMTP_USER,
      to,
      bcc,
      subject,
      text: text || html?.replace(/<[^>]+>/g, "") || "",
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err;
  }
}

