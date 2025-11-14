import nodemailer from 'nodemailer';

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM
} = process.env;

let transporter;

export function getTransporter() {
  if (transporter) return transporter;
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email not configured: missing EMAIL_* env vars');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const tx = getTransporter();
  if (!tx) return { skipped: true };
  const from = EMAIL_FROM || EMAIL_USER;
  return tx.sendMail({ from, to, subject, html, text });
}
