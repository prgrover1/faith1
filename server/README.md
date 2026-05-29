# Faith Email Server

This is the backend that lets Faith **actually send emails automatically** (with PO PDF attached) when you approve a draft. It runs on any free Node host.

---

## 1. Deploy in 5 minutes (Render — free)

1. Push the `server/` folder to its own GitHub repo, OR include it in your existing `faith` repo
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo, point it at the `server/` folder
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Add **Environment Variables** (Settings → Environment):

   | Key | Value (example) |
   |---|---|
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `yourbusiness@gmail.com` |
   | `SMTP_PASS` | *Gmail app password* (see below) |
   | `FROM_NAME` | `Faith on behalf of Jamie` |
   | `ALLOWED_ORIGINS` | `https://prgrover1.github.io` |

6. Deploy. You'll get a URL like `https://faith-email-server.onrender.com`

---

## 2. Get a Gmail App Password (the secret sauce)

Gmail won't accept your regular password for SMTP — but it accepts **app passwords**:

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Turn on **2-Step Verification** (if you haven't)
3. Go to **App passwords** → create one named "Faith"
4. Copy the 16-character password → paste into Render as `SMTP_PASS`

---

## 3. Wire it into Faith

1. Open your Faith dashboard
2. Click **⚙ Settings** in the Faith AI panel
3. Paste your Render URL into **Email Server URL**
4. Save

Now when you click **Approve & Send** on any draft, Faith:
- Generates the PO as a PDF
- Calls your Render server
- Server sends the real email from your Gmail with the PDF attached
- Vendor receives a professional-looking purchase order

---

## 4. Alternatives to Gmail

If you want a more business-grade option:

| Provider | Why | SMTP host |
|---|---|---|
| **Resend** | Best for SaaS, free 3K/mo | `smtp.resend.com` |
| **SendGrid** | Industry standard | `smtp.sendgrid.net` |
| **Mailgun** | Great deliverability | `smtp.mailgun.org` |
| **Postmark** | Best for transactional | `smtp.postmarkapp.com` |

For any of these, sign up, get SMTP credentials, paste them into Render's env vars in place of the Gmail ones. Faith doesn't care which one — it just talks to whatever SMTP server you point it at.

---

## 5. Running locally for testing

```bash
cd server
npm install
SMTP_HOST=smtp.gmail.com SMTP_PORT=465 SMTP_USER=you@gmail.com SMTP_PASS=app-password npm start
```

Then in Faith Settings, use `http://localhost:3000` as the Email Server URL.

---

## Troubleshooting

- **"Connection refused"** — Check `SMTP_HOST` and `SMTP_PORT`
- **"Invalid login"** — Double-check `SMTP_PASS`. For Gmail, you MUST use an app password, not your regular password
- **"Origin not allowed"** — Add your dashboard's domain to `ALLOWED_ORIGINS`
- **Render service sleeps** — Free Render services sleep after 15min of inactivity; first email after sleep takes ~30s to wake up. Upgrade to $7/mo to stay always-on.
