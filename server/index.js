// ──────────────────────────────────────────────────────────────
// FAITH EMAIL SERVER
// Receives requests from the Faith dashboard and sends real
// emails via your SMTP provider (Gmail, SendGrid, Resend, etc.)
// with the generated PO PDF as an attachment.
//
// DEPLOY THIS to Render / Railway / Fly.io (free tier works).
// Then paste the public URL into Faith → Settings → "Email Server URL".
// ──────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // PDFs come as base64 → allow large bodies

// ── ENVIRONMENT VARIABLES (set these in Render / Railway dashboard)
// SMTP_HOST       e.g. smtp.gmail.com
// SMTP_PORT       e.g. 465
// SMTP_USER       e.g. you@yourcompany.com
// SMTP_PASS       e.g. an app-password (NOT your real password)
// FROM_NAME       e.g. "Faith on behalf of Jamie"
// ALLOWED_ORIGINS comma-separated list of domains allowed to call this server
//                 e.g. "https://prgrover1.github.io,http://localhost:3000"
// ──────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Health-check (Render pings this)
app.get('/', (req, res) => res.json({ ok: true, name: 'Faith Email Server', time: new Date().toISOString() }));

// Send endpoint — the dashboard POSTs here
app.post('/api/send', async (req, res) => {
  try {
    const { to, subject, body, attachmentBase64, attachmentName, fromName, replyTo } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    const displayName = (fromName || process.env.FROM_NAME || 'Faith').replace(/[<>"]/g, '');
    const mail = {
      from: `"${displayName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body,
      replyTo: replyTo || undefined,
    };

    if (attachmentBase64 && attachmentName) {
      mail.attachments = [{
        filename: attachmentName,
        content: Buffer.from(attachmentBase64, 'base64'),
        contentType: 'application/pdf',
      }];
    }

    const info = await transporter.sendMail(mail);
    console.log('Email sent:', info.messageId, '→', to, 'from', displayName);
    res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('Send failed:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Faith email server listening on port ${PORT}`));
