import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

let transport;
function getTransport() {
  const email = config.email;
  if (email.provider !== 'smtp' || !email.smtpHost || !email.smtpUser || !email.smtpPass) return null;
  if (!transport) transport = nodemailer.createTransport({
    host: email.smtpHost,
    port: email.smtpPort,
    secure: email.smtpSecure,
    auth: { user: email.smtpUser, pass: email.smtpPass },
  });
  return transport;
}

export function emailConfigured() { return Boolean(getTransport()); }

export async function sendAccountEmail({ to, subject, text, html }) {
  const mailer = getTransport();
  if (!mailer) {
    logger.warn('Account email not sent: SMTP is not configured', { purpose: subject });
    return false;
  }
  try {
    await mailer.sendMail({
      from: { name: config.email.fromName, address: config.email.from },
      to, subject, text, html,
    });
    return true;
  } catch (error) {
    logger.error('Account email delivery failed', { message: error.message });
    return false;
  }
}
