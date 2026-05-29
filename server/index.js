// ──────────────────────────────────────────────────────────────
// FAITH EMAIL SERVER (multi-tenant)
// Each business sends from THEIR OWN email. The dashboard passes
// the customer's SMTP credentials with every request, so the email
// truly comes from their inbox — not a shared account.
// ──────────────────────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // PDFs come as base64 → allow large bodies

// Health-check (Render pings this)
app.get('/', (req, res) => res.json({ ok: true, name: 'Faith Email Server', time: new Date().toISOString() }));

// Verify-credentials endpoint — lets the dashboard test a connection before saving
app.post('/api/verify', async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
    if (!smtpHost || !smtpUser || !smtpPass) return res.status(400).json({ error: 'Missing SMTP credentials' });
    const t = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort || 465),
      secure: Number(smtpPort || 465) === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });
    await t.verify();
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Send endpoint — uses the CUSTOMER's own SMTP credentials from the request
app.post('/api/send', async (req, res) => {
  try {
    const {
      to, subject, body, attachmentBase64, attachmentName, fromName, replyTo,
      smtpHost, smtpPort, smtpUser, smtpPass,
    } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }
    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({ error: 'No email account connected. Connect your email in Settings first.' });
    }

    // Build a transporter from THIS customer's credentials
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort || 465),
      secure: Number(smtpPort || 465) === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    const displayName = (fromName || smtpUser).replace(/[<>"]/g, '');
    const mail = {
      from: `"${displayName}" <${smtpUser}>`,  // ← sends from the customer's own address
      to,
      subject,
      text: body,
      replyTo: replyTo || smtpUser || undefined,
    };

    if (attachmentBase64 && attachmentName) {
      mail.attachments = [{
        filename: attachmentName,
        content: Buffer.from(attachmentBase64, 'base64'),
        contentType: 'application/pdf',
      }];
    }

    const info = await transporter.sendMail(mail);
    console.log('Email sent:', info.messageId, '→', to, 'from', smtpUser);
    res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('Send failed:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Faith email server listening on port ${PORT}`));
