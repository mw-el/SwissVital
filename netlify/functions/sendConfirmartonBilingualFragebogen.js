// netlify/functions/sendConfirmationBilingual.js
// Zweisprachige Bestätigungs‑E‑Mail (DE / EN) für alle SwissVital‑Fragebogen.
// Enthält dieselben Daten wie der Web‑Dialog.

if (process.env.NETLIFY_DEV) require('dotenv').config();
const nodemailer = require('nodemailer');

/* ---------------------------------------------------------------------
   1 – Übersetzungen (DE / EN)  
   ------------------------------------------------------------------ */
const TXT = {
  de: {
    subject: n   => `SwissVital: Empfangsbestätigung für Ihren Fragebogen – ${n}`,
    hello:  (v,n)=> `Guten Tag ${v} ${n}`,
    thanks: loc   => `Herzlichen Dank, dass Sie zur Vorbereitung unserer persönlichen Konsultation das Formular für den Standort ${loc} eingereicht haben.`,
    next:         `Wir melden uns in Kürze, um einen Termin für Ihr Vorsorgegespräch abzustimmen.`,
    summary:      `Sie haben uns folgende Angaben übermittelt:`,
    fix:          `Sollte hier etwas fehlen oder falsch sein – keine Sorge. Im Gespräch können wir das korrigieren und alle nötigen Details ergänzen.`,
    bye:          `Freundliche Grüsse`,
    sender:       `SwissVital\nPatientenempfang`
  },
  en: {
    subject: n   => `SwissVital: confirmation of your questionnaire – ${n}`,
    hello:  (v,n)=> `Hello ${v} ${n}`,
    thanks: loc   => `Thank you for submitting the form for our ${loc} location – this helps us prepare your personal consultation.`,
    next:         `We will contact you shortly to arrange an appointment for your preventive consultation.`,
    summary:      `You provided the following information:`,
    fix:          `If anything is missing or incorrect, don’t worry – we can update it together during the consultation.`,
    bye:          `Kind regards`,
    sender:       `SwissVital\nPatient Services`
  }
};

/* ---------------------------------------------------------------------
   2 – Label‑Mapping für die Zusammenfassung (nach Bedarf ergänzen)  
   ------------------------------------------------------------------ */
const LABELS = {
  vorname:         { de: 'Vorname',                    en: 'First name' },
  nachname:        { de: 'Nachname',                   en: 'Last name' },
  email:           { de: 'E‑Mail',                     en: 'Email' },
  telefon:         { de: 'Telefon',                    en: 'Phone' },
  geburtsjahr:     { de: 'Geburtsjahr',                en: 'Year of birth' },
  geschlecht:      { de: 'Biologisches Geschlecht',    en: 'Biological sex' },
  sport_frequency: { de: 'Sporthäufigkeit',            en: 'Sport frequency' },
  sportarten:      { de: 'Sportarten',                 en: 'Sports' },
  freitext:        { de: 'Freitext',                   en: 'Free text' }
  // … weitere Felder hinzufügen …
};

/* ---------------------------------------------------------------------
   3 – HTML‑Generator  
   ------------------------------------------------------------------ */
function buildHtml(data, lang) {
  const t = TXT[lang] || TXT.de;
  const skip = new Set(['language','bot-field','website','sv_id','form_start_time']);

  const listItems = Object.entries(data)
    .filter(([k,v]) => v && !skip.has(k))
    .map(([k,v]) => {
      const label = LABELS[k]?.[lang] || k;
      const val   = Array.isArray(v) ? v.join(', ') : v;
      return `<li><strong>${label}:</strong> ${val}</li>`;
    })
    .join('');

  return /* html */`
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;color:#333">
    <p>${t.hello(data.vorname, data.nachname)}</p>
    <p>${t.thanks(data.standort || 'SwissVital')}</p>
    <p>${t.next}</p>

    <p><strong>${t.summary}</strong></p>
    <ul>${listItems}</ul>

    <p>${t.fix}</p>

    <p>${t.bye}<br>${t.sender.replace(/\n/g,'<br>')}</p>
  </div>`;
}

/* ---------------------------------------------------------------------
   4 – Netlify Function‑Handler  
   ------------------------------------------------------------------ */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: 'Method Not Allowed' };

  let data;
  try { data = JSON.parse(event.body); }
  catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const lang = (data.language || 'de').toLowerCase().startsWith('en') ? 'en' : 'de';
  const t    = TXT[lang];

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const mailOptions = {
    from: `"SwissVital" <${process.env.SMTP_USER}>`,
    to:   data.email,
    bcc:  ['team@swissvital.com'],
    subject: t.subject(`${data.vorname} ${data.nachname}`),
    html:    buildHtml(data, lang)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { statusCode: 200, body: 'Mail sent' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Mail send error' };
  }
};
