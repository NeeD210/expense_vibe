# Resend Email API for Transactional Emails (OTP)

## Overview
[Resend](https://resend.com/) is a modern email delivery platform designed for developers. It provides a simple API and SDKs for sending transactional and marketing emails, including OTPs for authentication flows.

---

## 1. Getting Started

1. **Sign Up & Get API Key:**
   - Go to [Resend Dashboard](https://resend.com/) and create an account.
   - Add and verify your sending domain.
   - Generate an API key from the dashboard.
2. **Install the SDK:**
   - For Node.js:
     ```bash
     npm install resend
     ```

---

## 2. Sending an Email (Node.js Example)

```js
import { Resend } from 'resend';

const resend = new Resend('YOUR_RESEND_API_KEY');

await resend.emails.send({
  from: 'YourApp <noreply@yourdomain.com>',
  to: ['user@example.com'],
  subject: 'Your OTP Code',
  html: '<p>Your OTP code is <strong>123456</strong></p>',
});
```

**Parameters:**
- `from`: Sender email (must be a verified domain)
- `to`: Recipient(s)
- `subject`: Email subject
- `html`/`text`: Email body (HTML or plain text)
- `attachments`, `cc`, `bcc`, `reply_to`, etc. (optional)

---

## 3. Using with React (Backend Only)
- Resend is a backend service. Use it in your API/server code to send OTPs or notifications.
- Call your backend endpoint from React to trigger the email.

---

## 4. Advanced Features
- **React Email Templates:** Use [react-email](https://react.email/) to build beautiful emails as React components.
- **Batch Sending:** Send up to 100 emails in one request.
- **Webhooks:** Receive delivery, open, click, and bounce events.
- **Analytics:** Track deliverability and engagement in the dashboard.

---

## 5. Best Practices
- Always verify your sending domain for best deliverability.
- Use a friendly `from` name and address.
- Rate-limit OTP requests to prevent abuse.
- Use environment variables for your API key.

---

## 6. References
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Resend Node.js SDK](https://resend.com/docs/sdk/nodejs)
- [React Email Templates](https://react.email/) 