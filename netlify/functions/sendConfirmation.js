// File: netlify/functions/sendConfirmation.js
const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: 'Invalid request body' };
  }

  const mailOptions = {
    from: `"Buchungsbestätigung" <${process.env.SMTP_USER}>`,
    to: data.email, // ✅ Dynamic recipient
    subject: 'Buchungsbestätigung',
    text: `Sehr geehrte/r ${data.vorname} ${data.nachname},
  
  Ihre Buchung wurde erfolgreich übermittelt. Hier sind die Details:
  
  - **Standort:** ${data.standort}
  - **Untersuchung:** ${data.untersuchung}
  - **Termin:** ${data.termin}
  
  Vielen Dank für Ihre Buchung!
  
  Freundliche Grüße,  
  Ihr Team von Swiss-Vital
  `
  };
  

  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true, // true for SSL/TLS (Port 465)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail(mailOptions);
    return { statusCode: 200, body: 'Mail sent' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Mail send error' };
  }
};
