import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
export const emailTemplates = {
  otp: (code: string) => ({
    subject: 'Your OTP Code',
    html: `
      <div>
        <h1>Your OTP Code</h1>
        <p>Your one-time password is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  }),
  welcome: (name: string) => ({
    subject: 'Welcome to Expense Vibing!',
    html: `
      <div>
        <h1>Welcome to Expense Vibing!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining Expense Vibing. We're excited to help you manage your expenses better!</p>
      </div>
    `,
  }),
  passwordReset: (resetLink: string) => ({
    subject: 'Reset Your Password',
    html: `
      <div>
        <h1>Reset Your Password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  }),
};

// Email sending functions
export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const data = await resend.emails.send({
      from: 'Expense Vibing <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

// Specific email sending functions
export const sendOTP = async (to: string, code: string) => {
  const { subject, html } = emailTemplates.otp(code);
  return sendEmail({ to, subject, html });
};

export const sendWelcomeEmail = async (to: string, name: string) => {
  const { subject, html } = emailTemplates.welcome(name);
  return sendEmail({ to, subject, html });
};

export const sendPasswordReset = async (to: string, resetLink: string) => {
  const { subject, html } = emailTemplates.passwordReset(resetLink);
  return sendEmail({ to, subject, html });
}; 