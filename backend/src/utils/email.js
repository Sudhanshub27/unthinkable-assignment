const nodemailer = require('nodemailer');
require('dotenv').config();

// Uses any SMTP provider via env vars. Works out of the box with a free
// tier like Gmail (with an App Password) or Brevo/Sendinblue SMTP.
// If SMTP env vars are not set, emails are logged to the console instead
// of failing the request — useful for local dev / demo without a mail account.

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.log(`[email:mock] To: ${to} | Subject: ${subject}\n${text}`);
    return { mocked: true };
  }
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    return info;
  } catch (err) {
    // Never let an email failure break the underlying request/transaction.
    console.error('Email send failed:', err.message);
    return { error: err.message };
  }
}

function complaintStatusChangeEmail({ residentName, complaintId, category, oldStatus, newStatus, note }) {
  return {
    subject: `Complaint #${complaintId} status updated: ${newStatus}`,
    text: `Hi ${residentName},\n\nYour complaint #${complaintId} (${category}) has moved from "${oldStatus}" to "${newStatus}".${note ? `\n\nNote from admin: ${note}` : ''}\n\nYou can log in to the Society Maintenance Tracker to view full details.\n\nRegards,\nSociety Management`,
  };
}

function importantNoticeEmail({ residentName, title, body }) {
  return {
    subject: `Important Notice: ${title}`,
    text: `Hi ${residentName},\n\nA new important notice has been posted:\n\n"${title}"\n${body}\n\nRegards,\nSociety Management`,
  };
}

module.exports = { sendEmail, complaintStatusChangeEmail, importantNoticeEmail };
