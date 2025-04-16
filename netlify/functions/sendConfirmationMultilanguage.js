// netlify/functions/sendConfirmationMultilanguage.js

// Load .env file only in local development
if (process.env.NETLIFY_DEV) {
  require('dotenv').config();
}

const nodemailer = require('nodemailer');

// Übersetzungstabelle für E-Mails
const translations = {
  de: {
    subject: "Buchungsbestätigung: für",
    greeting: "Guten Tag",
    confirmation_intro: "Dies ist eine automatische Empfangsbestätigung Ihrer Terminbuchung bei SwisVital in",
    data_intro: "Wir haben die folgenden Angaben von Ihnen notiert:",
    personal_data_title: "Persönliche Daten:",
    appointment_details_title: "Termindetails:",
    confirmation_question: "Stimmt das so für Sie? Falls nicht, antworten Sie einfach mit Ihrem Korrekturwunsch auf diese Nachricht.",
    callback_note: "Wir werden Sie aber ohnehin noch anrufen, um Ihren Wunschtermin zu fixieren. Dann bringen wir das rasch in Ordnung – verlassen Sie sich darauf.",
    goodbye: "Freundliche Grüsse und bis bald.",
    sender: "Der Patientenempfang von SwissVital"
  },
  en: {
    subject: "Booking Confirmation: for",
    greeting: "Hello",
    confirmation_intro: "This is an automatic confirmation of your booking at SwissVital in",
    data_intro: "We have noted the following information from you:",
    personal_data_title: "Personal Data:",
    appointment_details_title: "Appointment Details:",
    confirmation_question: "Is this correct for you? If not, please reply to this message with your correction request.",
    callback_note: "We will call you anyway to fix your desired appointment. Then we will quickly sort it out - you can rely on that.",
    goodbye: "Kind regards and see you soon.",
    sender: "The Patient Reception of SwissVital"
  },
  fr: {
    subject: "Confirmation de réservation : pour",
    greeting: "Bonjour",
    confirmation_intro: "Ceci est une confirmation automatique de votre réservation chez SwissVital à",
    data_intro: "Nous avons noté les informations suivantes de votre part :",
    personal_data_title: "Données personnelles :",
    appointment_details_title: "Détails du rendez-vous :",
    confirmation_question: "Est-ce correct pour vous ? Si non, veuillez répondre à ce message avec votre demande de correction.",
    callback_note: "Nous vous appellerons de toute façon pour fixer votre rendez-vous souhaité. Nous réglerons alors rapidement le problème - vous pouvez compter sur nous.",
    goodbye: "Meilleures salutations et à bientôt.",
    sender: "L'accueil des patients de SwissVital"
  },
  it: {
    subject: "Conferma di prenotazione: per",
    greeting: "Buongiorno",
    confirmation_intro: "Questa è una conferma automatica della tua prenotazione presso SwissVital a",
    data_intro: "Abbiamo annotato le seguenti informazioni da te:",
    personal_data_title: "Dati personali:",
    appointment_details_title: "Dettagli dell'appuntamento:",
    confirmation_question: "Va bene così per te? In caso contrario, rispondi a questo messaggio con la tua richiesta di correzione.",
    callback_note: "Ti chiameremo comunque per fissare l'appuntamento desiderato. Sistemeremo rapidamente la questione - puoi contare su questo.",
    goodbye: "Cordiali saluti e a presto.",
    sender: "La reception pazienti di SwissVital"
  }
};

// Diese Funktion hilft, die Produktdetails in der E-Mail in der richtigen Sprache anzuzeigen
function getProductDetailsInLanguage(productId, lang) {
  // In einer echten Anwendung würde man hier wahrscheinlich die Daten aus einer Datenbank holen
  // Für dieses Beispiel verwenden wir eine hartcodierte Zuordnung
  const productDetails = {
    product1: {
      de: { name: "Produkt 1", price: "1970" },
      en: { name: "Product 1", price: "1970" },
      fr: { name: "Produit 1", price: "1970" },
      it: { name: "Prodotto 1", price: "1970" }
    },
    product2: {
      de: { name: "Produkt 2", price: "2350" },
      en: { name: "Product 2", price: "2350" },
      fr: { name: "Produit 2", price: "2350" },
      it: { name: "Prodotto 2", price: "2350" }
    },
    product3: {
      de: { name: "Produkt 3", price: "850" },
      en: { name: "Product 3", price: "850" },
      fr: { name: "Produit 3", price: "850" },
      it: { name: "Prodotto 3", price: "850" }
    }
  };
  
  return productDetails[productId]?.[lang] || productDetails[productId]?.de;
}

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

  // Sprachinformation aus dem Formular auslesen, Fallback auf Deutsch
  const lang = data.language || 'de';
  const t = translations[lang] || translations.de;

  // E-Mail-Inhalte zusammenstellen
  const mailOptions = {
    from: `"Buchungsbestätigung" <${process.env.SMTP_USER}>`,
    to: data.email,
    bcc: ['niko.loehr@swiss-vital.ch', 'matthias.wiemeyer@schreibszene.ch'],
    subject: `${t.subject} ${data.vorname} ${data.nachname}`,
    html: `<div style="font-family: Arial, Helvetica, sans-serif; color: #333333; line-height: 130%">
      <p>${t.greeting} ${data.vorname} ${data.nachname}</p>

      <p>${t.confirmation_intro} ${data.standort}.</p>

      <p>${t.data_intro}</p>

      <p><strong>${t.personal_data_title}</strong></p>
      <ul>
        <li>Vorname: ${data.vorname}</li>
        <li>Nachname: ${data.nachname}</li>
        <li>Geburtsjahr: ${data.geburtsjahr}</li>
        <li>E-Mail: ${data.email}</li>
        <li>Telefon: ${data.telefon}</li>
      </ul>

      <p><strong>${t.appointment_details_title}</strong></p>
      <ul>
        <li>Gewünschter Praxis-Standort: ${data.standort}</li>
        <li>Untersuchung: ${data.product_name} - CHF ${data.product_price}.-</li>
        <li>Gewünschter Termin: ${data.terminwunsch}</li>
      </ul>

      <p>${t.confirmation_question} <b>${t.callback_note}</b></p>

      <p>${t.goodbye}</p>

      <p>${t.sender}<br><br></p>
      
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