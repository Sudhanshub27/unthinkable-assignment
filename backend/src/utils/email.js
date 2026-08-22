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

const pool = require('../db/pool');

async function getSocietySettings() {
  try {
    const res = await pool.query("SELECT key, value FROM settings WHERE key IN ('society_name', 'support_email')");
    const map = {};
    res.rows.forEach((r) => {
      map[r.key] = r.value;
    });
    return {
      societyName: map.society_name || 'Unthinkable Sudhanshu Society',
      supportEmail: map.support_email || 'office@sudhanshubatraunthinkable.com',
    };
  } catch (e) {}
  return {
    societyName: 'Unthinkable Sudhanshu Society',
    supportEmail: 'office@sudhanshubatraunthinkable.com',
  };
}

async function logEmailAttempt({ recipientEmail, recipientName, eventType, subject, body, status, providerMsgId, errorDetails, complaintId, noticeId }) {
  try {
    await pool.query(
      `INSERT INTO email_logs (recipient_email, recipient_name, event_type, subject, body, status, provider_msg_id, error_details, complaint_id, notice_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        recipientEmail,
        recipientName || null,
        eventType || 'General Notification',
        subject,
        body || null,
        status,
        providerMsgId || null,
        errorDetails || null,
        complaintId || null,
        noticeId || null,
      ]
    );
  } catch (err) {
    console.error('Failed to record email log in DB:', err);
  }
}

async function sendEmail({ to, recipientName, subject, text, html, eventType, complaintId, noticeId }) {
  const { societyName, supportEmail } = await getSocietySettings();
  const rawSender = process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'onboarding@resend.dev';
  let emailAddr = rawSender;
  const match = rawSender.match(/<([^>]+)>/);
  if (match) {
    emailAddr = match[1];
  }
  const dynamicFrom = `${societyName} <${emailAddr}>`;
  const recipientEmail = Array.isArray(to) ? to.join(', ') : to;
  const emailBody = text || (html ? html.replace(/<[^>]+>/g, '') : '');

  // Option 1: Direct Resend API Key support
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: dynamicFrom,
          to: Array.isArray(to) ? to : [to],
          reply_to: supportEmail,
          subject,
          text,
          html: html || `<p>${text ? text.replace(/\n/g, '<br/>') : ''}</p>`,
        }),
      });
      const data = await resendRes.json();
      if (!resendRes.ok) {
        console.error('Resend API error:', data);
        const errMsg = typeof data === 'object' ? JSON.stringify(data) : String(data);
        await logEmailAttempt({
          recipientEmail,
          recipientName,
          eventType,
          subject,
          body: emailBody,
          status: 'Failed',
          errorDetails: errMsg,
          complaintId,
          noticeId,
        });
        return { success: false, error: data };
      }

      const resendId = data && data.id ? data.id : null;
      await logEmailAttempt({
        recipientEmail,
        recipientName,
        eventType,
        subject,
        body: emailBody,
        status: 'Sent',
        providerMsgId: resendId,
        complaintId,
        noticeId,
      });
      return { success: true, data };
    } catch (resendErr) {
      console.error('Resend HTTP request failed:', resendErr.message);
      await logEmailAttempt({
        recipientEmail,
        recipientName,
        eventType,
        subject,
        body: emailBody,
        status: 'Failed',
        errorDetails: resendErr.message,
        complaintId,
        noticeId,
      });
      return { success: false, error: resendErr.message };
    }
  }

  // Option 2: Standard Nodemailer SMTP
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: dynamicFrom,
        to,
        replyTo: supportEmail,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      });
      const smtpMsgId = info && info.messageId ? info.messageId : null;
      await logEmailAttempt({
        recipientEmail,
        recipientName,
        eventType,
        subject,
        body: emailBody,
        status: 'Sent',
        providerMsgId: smtpMsgId,
        complaintId,
        noticeId,
      });
      return { success: true, info };
    } catch (err) {
      console.error('Email send failed:', err.message);
      await logEmailAttempt({
        recipientEmail,
        recipientName,
        eventType,
        subject,
        body: emailBody,
        status: 'Failed',
        errorDetails: err.message,
        complaintId,
        noticeId,
      });
      return { success: false, error: err.message };
    }
  }

  // Option 3: Fallback console mock mode
  console.log(`[email:mock] From: ${dynamicFrom} | Reply-To: ${supportEmail} | To: ${recipientEmail} | Subject: ${subject}\n${text}`);
  await logEmailAttempt({
    recipientEmail,
    recipientName,
    eventType,
    subject,
    body: emailBody,
    status: 'Mocked',
    errorDetails: 'Console mock mode active (No RESEND_API_KEY or SMTP configured)',
    complaintId,
    noticeId,
  });
  return { success: true, mocked: true };
}

function complaintStatusChangeEmail({ residentName, complaintId, category, oldStatus, newStatus, note, societyName }) {
  const name = societyName || 'Society Management';
  return {
    subject: `[${name}] Complaint #${complaintId} status updated: ${newStatus}`,
    text: `Hi ${residentName},\n\nYour complaint #${complaintId} (${category}) has moved from "${oldStatus}" to "${newStatus}".${note ? `\n\nNote from admin: ${note}` : ''}\n\nYou can log in to the Society Tracker to view full details.\n\nRegards,\n${name}`,
  };
}

function importantNoticeEmail({ residentName, title, body, societyName }) {
  const name = societyName || 'Society Management';
  return {
    subject: `[${name}] Important Notice: ${title}`,
    text: `Hi ${residentName},\n\nA new important notice has been posted:\n\n"${title}"\n${body}\n\nRegards,\n${name}`,
  };
}

module.exports = { sendEmail, complaintStatusChangeEmail, importantNoticeEmail };
