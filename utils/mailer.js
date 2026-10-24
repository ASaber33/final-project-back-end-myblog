const nodemailer = require('nodemailer');

// Reset codes are logged only in local development when SMTP is not configured.
const configured = () => ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].every((key) => Boolean(process.env[key]));

let transport = null;
function getTransport() {
  if (!configured()) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

async function sendResetCode({ to, code }) {
  const mailer = getTransport();
  const body = `كود استعادة كلمة المرور في أوميجا بلوج: ${code}\n\nالكود صالح لمدة 15 دقيقة. لو مش أنت اللي طلبت، تجاهل الرسالة.`;
  if (!mailer) {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('Email delivery is not configured.');
      error.code = 'DELIVERY_NOT_CONFIGURED';
      throw error;
    }
    console.log(`[reset-password] SMTP not configured. Code for ${to}: ${code}`);
    return { delivered: false, channel: 'log' };
  }
  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'استعادة كلمة المرور - أوميجا بلوج',
    text: body,
  });
  return { delivered: true, channel: 'email' };
}

module.exports = { sendResetCode, smtpConfigured: configured };
