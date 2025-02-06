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
    from: '"Ihre Website" <no-reply@deinedomain.ch>',
    to: 'mw@elektromail',
    subject: 'Neue Formular-Einsendung',
    text: `Neue Buchung:
E-Mail: ${data.email}
Standort: ${data.standort}
Vorname: ${data.vorname}
Nachname: ${data.nachname}
Untersuchung: ${data.untersuchung}
Termin: ${data.termin}`
  };

  let transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    auth: {
      user: 'deinSMTPUser',
      pass: 'deinSMTPPass'
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
