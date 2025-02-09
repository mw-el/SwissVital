// File: netlify/functions/sendConfirmation.js

// Load .env file **only in local development**
if (process.env.NETLIFY_DEV) {
  require('dotenv').config();
}

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
    to: data.email,
    subject: 'Buchungsbestätigung',
    html: `<div style="font-family: Arial, Helvetica, sans-serif; color: #333333; line-height: 130%">
      <p>Guten Tag ${data.vorname} ${data.nachname}</p>

      <p>Dies ist eine automatische Empfangsbestätigung Ihrer Terminbuchung bei SwisVital in ${data.standort}.</p>

      <p>Wir haben die folgenden Angaben von Ihnen notiert:</p>

      <p><strong>Persönliche Daten:</strong></p>
      <ul>
        <li>Vorname: ${data.vorname}</li>
        <li>Nachname: ${data.nachname}</li>
        <li>Geburtsdatum: ${data.geburtsdatum}</li>
        <li>E-Mail: ${data.email}</li>
        <li>Telefon: ${data.telefon}</li>
      </ul>

      <p><strong>Termindetails:</strong></p>
      <ul>
        <li>Gewünschter Praxis-Standort: ${data.standort}</li>
        <li>Untersuchung: ${data.untersuchung}</li>
        <li>Gewünschter Termin: ${data.terminwunsch}</li>
      </ul>

      <p>Stimmt das so für Sie? Falls nicht, antworten Sie einfach mit Ihrem Korrekturwunsch auf diese Nachricht. <b>Wir werden Sie aber ohnehin noch anrufen, um Ihren Wunschtermin zu fixieren. Dann bringen wir das rasch in Ordnung.</b></p>

      <p>Zu den normalen Praxiszeiten rufen wir meist innerhalb einer Stunde an. Ansonsten melden wir uns am nächsten Werktag – verlassen Sie sich darauf.</p>

      <p>Freundliche Grüsse und bis bald.</p>

      <p>Der Patientenempfang von SwissVital<br><br></p>
      
      <p>
        <span style="color: #f94143;">Swiss<b>Vital</b></span> – Metarad AG<br>
         <span style="font-size: 90%, line.height: 90%;">Zürichbergstrasse 146<br>
        8044 Zürich<br>
        Schweiz<br>
        E-Mail: service@swiss-vital.ch<br>
        Web: www.swiss-vital.ch</span>
      </p>
    </div>`
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
