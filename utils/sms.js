const configured = () => (
  ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER']
    .every((key) => Boolean(process.env[key]))
);

async function sendResetCode({ to, code }) {
  if (!configured()) {
    const error = new Error('SMS delivery is not configured.');
    error.code = 'DELIVERY_NOT_CONFIGURED';
    throw error;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const credentials = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: process.env.TWILIO_FROM_NUMBER,
      To: to,
      Body: `كود استعادة كلمة المرور في أوميجا بلوج: ${code}. صالح لمدة 15 دقيقة.`,
    }),
  });

  if (!response.ok) {
    const error = new Error(`SMS provider rejected the request (${response.status}).`);
    error.code = 'SMS_DELIVERY_FAILED';
    throw error;
  }

  return { delivered: true, channel: 'sms' };
}

module.exports = { sendResetCode, smsConfigured: configured };
