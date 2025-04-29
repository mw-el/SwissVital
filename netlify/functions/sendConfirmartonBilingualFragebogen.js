// netlify/functions/sendConfirmartonBilingualFragebogen.js
// Zentrale E-Mail-Verarbeitungsfunktion für alle SwissVital-Formulare
// Verarbeitet sowohl Benutzerbestätigungen als auch Team-Benachrichtigungen

if (process.env.NETLIFY_DEV) require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// E-Mail-Routing-Konfiguration laden
let emailRouting;
try {
  const routingFilePath = path.join(__dirname, 'email-routing.json');
  const routingContent = fs.readFileSync(routingFilePath, 'utf8');
  emailRouting = JSON.parse(routingContent);
} catch (error) {
  console.error('Error loading email routing configuration:', error);
  // Fallback-Konfiguration, wenn die Datei nicht geladen werden kann
  emailRouting = { 
    defaults: { 
      from: "Swiss-Vital Patientenempfang <patientenempfang@swiss-vital.ch>",
      bcc: ["archiv@swiss-vital.ch", "swissvital@elektromail.ch"]
    } 
  };
}

/* ---------------------------------------------------------------------
   1 – Übersetzungen (DE / EN) für Benutzer-Bestätigungen
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
    fix:          `If anything is missing or incorrect, don't worry – we can update it together during the consultation.`,
    bye:          `Kind regards`,
    sender:       `SwissVital\nPatient Services`
  }
};

/* ---------------------------------------------------------------------
   2 – Label‑Mapping für die Zusammenfassung (nach Bedarf ergänzen)  
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
  freitext:        { de: 'Freitext',                   en: 'Free text' },
  rueckruf_zeiten: { de: 'Rückrufzeiten',              en: 'Callback times' },
  zusatzinformationen: { de: 'Zusatzinformationen',    en: 'Additional information' },
  recent_injuries: { de: 'Kürzliche Verletzungen',     en: 'Recent injuries' },
  fruehere_verletzungen: { de: 'Frühere Verletzungen', en: 'Previous injuries' },
  koerperregionen: { de: 'Belastete Körperregionen',   en: 'Stressed body regions' },
  pain_after_sport: { de: 'Schmerzen nach Sport',      en: 'Pain after sports' }
  // ... weitere Felder hinzufügen ...
};

/* ---------------------------------------------------------------------
   3 – HTML‑Generator für Benutzer-Bestätigungen
   ------------------------------------------------------------------ */
function buildHtml(data, lang) {
  const t = TXT[lang] || TXT.de;
  const skip = new Set(['language','bot-field','website','sv_id','form_start_time', 'form_type', 'datenschutz', 'datenschutz1']);

  const listItems = Object.entries(data)
    .filter(([k,v]) => v && !skip.has(k))
    .map(([k,v]) => {
      // Label in der richtigen Sprache finden oder Schlüssel als Fallback verwenden
      const label = LABELS[k]?.[lang] || k;
      
      // Wert formatieren (Array als kommagetrennte Liste)
      let val;
      if (Array.isArray(v)) {
        val = v.join(', ');
      } else if (typeof v === 'boolean') {
        val = v ? (lang === 'de' ? 'Ja' : 'Yes') : (lang === 'de' ? 'Nein' : 'No');
      } else {
        val = v;
      }
      
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
   4 – HTML‑Generator für Team-Benachrichtigungen
   ------------------------------------------------------------------ */
function buildTeamNotificationHtml(data, formType, lang) {
  // Übersetzungen für die Team-Benachrichtigung
  const t = lang === 'en' ? {
    title: 'New Form Submission',
    formType: 'Form Type',
    contact: 'Contact Information',
    submittedData: 'Submitted Data',
    automatedMessage: 'This is an automated notification.'
  } : {
    title: 'Neue Formular-Einreichung',
    formType: 'Formulartyp',
    contact: 'Kontaktdaten',
    submittedData: 'Übermittelte Daten',
    automatedMessage: 'Dies ist eine automatische Benachrichtigung.'
  };

  // Felder für die Kontaktinformationen
  const contactFields = ['vorname', 'nachname', 'email', 'telefon', 'rueckruf_zeiten', 'zusatzinformationen'];
  
  // Felder, die übersprungen werden sollen
  const skip = new Set(['language', 'bot-field', 'website', 'sv_id', 'form_start_time', 'form_type', 'datenschutz', 'datenschutz1', 
                        ...contactFields]);

  // Kontaktdaten formatieren
  const contactItems = contactFields
    .filter(k => data[k])
    .map(k => {
      const label = LABELS[k]?.[lang] || k;
      const val = Array.isArray(data[k]) ? data[k].join(', ') : data[k];
      return `<tr><td><strong>${label}:</strong></td><td>${val}</td></tr>`;
    })
    .join('');

  // Formular-spezifische Daten formatieren
  const dataItems = Object.entries(data)
    .filter(([k,v]) => v && !skip.has(k))
    .map(([k,v]) => {
      const label = LABELS[k]?.[lang] || k;
      const val = Array.isArray(v) ? v.join(', ') : v;
      return `<tr><td><strong>${label}:</strong></td><td>${val}</td></tr>`;
    })
    .join('');

  // Human-readable Formulartyp generieren
  let formTypeName;
  switch(formType) {
    case 'sportler-survey': formTypeName = lang === 'de' ? 'Sportler-Fragebogen' : 'Athletes Questionnaire'; break;
    case 'stress-survey': formTypeName = lang === 'de' ? 'Stress-Fragebogen' : 'Stress Questionnaire'; break;
    case 'familiaer-survey': formTypeName = lang === 'de' ? 'Familiäre Vorsorge' : 'Family History'; break;
    case 'ganzheitlich-survey': formTypeName = lang === 'de' ? 'Ganzheitliche Vorsorge' : 'Holistic Prevention'; break;
    case 'individuell-survey': formTypeName = lang === 'de' ? 'Individuelle Vorsorge' : 'Individual Prevention'; break;
    case 'chronisch-survey': formTypeName = lang === 'de' ? 'Chronische Beschwerden' : 'Chronic Complaints'; break;
    default: formTypeName = formType;
  }

  return /* html */`
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;color:#333">
    <h2>${t.title}</h2>
    <p><strong>${t.formType}:</strong> ${formTypeName}</p>

    <h3>${t.contact}</h3>
    <table style="border-collapse: collapse; width: 100%;">
      <tbody>${contactItems}</tbody>
    </table>

    <h3>${t.submittedData}</h3>
    <table style="border-collapse: collapse; width: 100%;">
      <tbody>${dataItems}</tbody>
    </table>

    <p><em>${t.automatedMessage}</em></p>
  </div>`;
}

/* ---------------------------------------------------------------------
   5 – Formulartyp-spezifische Betreffzeilen
   ------------------------------------------------------------------ */
const SUBJECT_TEMPLATES = {
  de: {
    'sportler-survey': name => `Neue Sportler-Anfrage von ${name}`,
    'stress-survey': name => `Neue Stress-Anfrage von ${name}`,
    'familiaer-survey': name => `Neue Anfrage zur familiären Vorsorge von ${name}`,
    'ganzheitlich-survey': name => `Neue Anfrage zur ganzheitlichen Vorsorge von ${name}`,
    'individuell-survey': name => `Neue Anfrage zur individuellen Vorsorge von ${name}`,
    'chronisch-survey': name => `Neue Anfrage zu chronischen Beschwerden von ${name}`,
    'default': name => `Neue Anfrage von ${name}`
  },
  en: {
    'sportler-survey': name => `New athlete inquiry from ${name}`,
    'stress-survey': name => `New stress inquiry from ${name}`,
    'familiaer-survey': name => `New family history inquiry from ${name}`,
    'ganzheitlich-survey': name => `New holistic prevention inquiry from ${name}`,
    'individuell-survey': name => `New individual prevention inquiry from ${name}`,
    'chronisch-survey': name => `New chronic complaints inquiry from ${name}`,
    'default': name => `New inquiry from ${name}`
  }
};

/* ---------------------------------------------------------------------
   6 – Netlify Function‑Handler  
   ------------------------------------------------------------------ */
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: 'Method Not Allowed' };

  let data;
  try { data = JSON.parse(event.body); }
  catch (error) {
    console.error('JSON parsing error:', error);
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const formType = data.form_type || 'default';
  const lang = (data.language || 'de').toLowerCase().startsWith('en') ? 'en' : 'de';
  const fullName = `${data.vorname || ''} ${data.nachname || ''}`.trim();
  const t = TXT[lang];

  // E-Mail-Routing-Konfiguration für diesen Formulartyp holen
  const formConfig = emailRouting[formType] || {};
  const fromAddress = formConfig.from || emailRouting.defaults.from;
  const bccAddresses = (formConfig.bcc || emailRouting.defaults.bcc || []).join(',');

  // E-Mail-Transporter erstellen
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  try {
    // Prüfen, ob es eine gültige E-Mail-Adresse gibt
    const hasValidEmail = data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
    
    // 1. E-Mail an Benutzer senden (wenn eine gültige E-Mail-Adresse vorhanden ist)
    if (hasValidEmail) {
      const userMailOptions = {
        from: fromAddress,
        to: data.email,
        subject: t.subject(fullName),
        html: buildHtml(data, lang)
      };
      
      await transporter.sendMail(userMailOptions);
      console.log(`User confirmation email sent to: ${data.email}`);
    } else {
      console.log('No valid user email provided, skipping confirmation email');
    }
    
    // 2. E-Mail an Team senden (immer)
    // Betreffzeile aus Template oder Fallback
    const teamSubjectTemplate = SUBJECT_TEMPLATES[lang][formType] || SUBJECT_TEMPLATES[lang]['default'];
    const teamMailOptions = {
      from: fromAddress,
      to: bccAddresses,
      subject: teamSubjectTemplate(fullName),
      html: buildTeamNotificationHtml(data, formType, lang)
    };

    await transporter.sendMail(teamMailOptions);
    console.log(`Team notification email sent to: ${bccAddresses}`);
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({
        success: true,
        message: lang === 'de' ? 'E-Mails erfolgreich gesendet' : 'Emails sent successfully'
      })
    };
  } catch (err) {
    console.error('Email sending error:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({
        success: false,
        message: lang === 'de' ? 'Fehler beim E-Mail-Versand' : 'Email sending error',
        error: err.message
      })
    };
  }
};