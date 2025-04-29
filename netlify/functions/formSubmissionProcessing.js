// formSubmissionProcessing.js - Unified form handler for all SwissVital forms
const querystring = require('querystring');
const nodemailer = require('nodemailer');

// Configuration for different form types
const formConfig = {
  'sportler-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon', 'geschlecht'],
    emailTemplate: 'sportler-email-template',
    recipients: ['sport@swissvital.com'],
    subject: {
      de: 'Neue Sportler-Anfrage bei SwissVital',
      en: 'New athlete inquiry at SwissVital'
    }
  },
  'stress-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon', 'stress_level'],
    emailTemplate: 'stress-email-template',
    recipients: ['stress@swissvital.com'],
    subject: {
      de: 'Neue Stress-Anfrage bei SwissVital',
      en: 'New stress inquiry at SwissVital'
    }
  },
  'familiaer-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon'],
    emailTemplate: 'familiaer-email-template',
    recipients: ['family@swissvital.com'],
    subject: {
      de: 'Neue Familienanamnese-Anfrage bei SwissVital',
      en: 'New family history inquiry at SwissVital'
    }
  },
  'ganzheitlich-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon'],
    emailTemplate: 'ganzheitlich-email-template',
    recipients: ['holistic@swissvital.com'],
    subject: {
      de: 'Neue ganzheitliche Anfrage bei SwissVital',
      en: 'New holistic inquiry at SwissVital'
    }
  },
  'individuell-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon'],
    emailTemplate: 'individuell-email-template',
    recipients: ['individual@swissvital.com'],
    subject: {
      de: 'Neue individuelle Anfrage bei SwissVital',
      en: 'New individual inquiry at SwissVital'
    }
  },
  'chronisch-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon'],
    emailTemplate: 'chronisch-email-template',
    recipients: ['chronic@swissvital.com'],
    subject: {
      de: 'Neue Anfrage zu chronischen Beschwerden bei SwissVital',
      en: 'New chronic condition inquiry at SwissVital'
    }
  }
  // Add configurations for other form types as needed
};

// In-memory store for IP rate limiting
// In production, consider using a database or Redis
const ipCounts = {};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates an email body based on form data and language
 * @param {object} fields - Form fields
 * @param {string} formType - Type of form submitted
 * @param {string} language - Language code (de/en)
 * @returns {string} - HTML email body
 */
function generateEmailBody(fields, formType, language = 'de') {
  const isGerman = language === 'de';
  
  let html = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #003366; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${isGerman ? 'Neue Anfrage' : 'New Inquiry'} - SwissVital</h1>
        <p>${isGerman ? 'Formulartyp' : 'Form type'}: <strong>${formType}</strong></p>
        <table>
          <tr>
            <th>${isGerman ? 'Feld' : 'Field'}</th>
            <th>${isGerman ? 'Wert' : 'Value'}</th>
          </tr>
  `;
  
  // Add all fields to the email
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      html += `
        <tr>
          <td><strong>${key}</strong></td>
          <td>${value.join(', ')}</td>
        </tr>
      `;
    } else if (value) {
      html += `
        <tr>
          <td><strong>${key}</strong></td>
          <td>${value}</td>
        </tr>
      `;
    }
  }
  
  html += `
        </table>
        <p>${isGerman ? 'Diese Nachricht wurde automatisch generiert.' : 'This message was generated automatically.'}</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Send email with form data
 * @param {object} fields - Form data fields
 * @param {string} formType - Type of form
 * @param {string} language - Language code
 * @returns {Promise} - Email sending result
 */
async function sendEmail(fields, formType, language) {
  const config = formConfig[formType];
  if (!config) throw new Error('Unknown form type');
  
  // Create email transport (configure with your SMTP settings)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  
  // Generate email body
  const htmlBody = generateEmailBody(fields, formType, language);
  
  // Prepare email
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'forms@swissvital.com',
    to: config.recipients.join(','),
    subject: config.subject[language] || config.subject.de,
    html: htmlBody
  };
  
  // Send confirmation to user if email is provided
  if (fields.email && isValidEmail(fields.email)) {
    // Send user confirmation (implementation depends on your templates)
    // This would be a separate email send with a user-friendly template
  }
  
  // Send email to recipients
  return transporter.sendMail(mailOptions);
}

exports.handler = async (event) => {
  try {
    // Only allow POST method
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Get client IP for rate limiting
    const ip = event.headers['client-ip'] || 
               event.headers['x-forwarded-for'] || 
               'unknown';

    // Parse the submission
    const submission = JSON.parse(event.body);
    const formType = submission.type;
    const fields = submission.fields;
    const language = fields.language || 'de';
    
    // Get configuration for this form type
    const config = formConfig[formType];
    if (!config) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Unbekannter Formulartyp.' })
      };
    }
    
    // === SPAM PROTECTION ===
    
    // 1. Missing sv_id check
    if (!submission.spamProtection.sv_id) {
      console.log('Spam detected: missing sv_id, ignoring submission');
      return {
        statusCode: 302,
        headers: {
          Location: '/danke-anmeldung/',
          'Cache-Control': 'no-cache'
        }
      };
    }

    // 2. Check for honeypot fields
    if (fields.website || fields['bot-field']) {
      console.log('Spam detected: honeypot field filled');
      return {
        statusCode: 302,
        headers: {
          Location: '/danke-anmeldung/',
          'Cache-Control': 'no-cache'
        }
      };
    }

    // 3. Time-based fill-out check
    const start = parseInt(submission.spamProtection.form_start_time || 0);
    const now = Date.now();
    if (start > 0 && now - start < 2000) {
      console.log('Spam detected: form filled too quickly');
      return {
        statusCode: 302,
        headers: {
          Location: '/danke-anmeldung/',
          'Cache-Control': 'no-cache'
        }
      };
    }

    // 4. IP Rate limiting
    if (!ipCounts[ip] || now - ipCounts[ip].timestamp > 3600000) {
      ipCounts[ip] = { count: 0, timestamp: now };
    }
    if (ipCounts[ip].count >= 5) {
      console.log(`Spam detected: rate limit exceeded for IP ${ip}`);
      return {
        statusCode: 429,
        body: JSON.stringify({
          message: 'Zu viele Anmeldungen. Bitte später erneut versuchen.'
        })
      };
    }
    ipCounts[ip].count++;

    // 5. Required fields validation
    for (const field of config.requiredFields) {
      if (!fields[field]) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            message: language === 'de' 
              ? `Feld ${field} ist erforderlich.` 
              : `Field ${field} is required.` 
          })
        };
      }
    }

    // 6. Email validation if provided
    if (fields.email) {
      if (!isValidEmail(fields.email)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            message: language === 'de' 
              ? 'Ungültige E-Mail-Adresse.' 
              : 'Invalid email address.' 
          })
        };
      }
    }
    
    // 7. Name length validation
    if (fields.vorname && (fields.vorname.length < 2 || fields.vorname.length > 50)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: language === 'de' 
            ? 'Vorname muss zwischen 2 und 50 Zeichen lang sein.' 
            : 'First name must be between 2 and 50 characters.' 
        })
      };
    }

    if (fields.nachname && (fields.nachname.length < 2 || fields.nachname.length > 50)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          message: language === 'de' 
            ? 'Nachname muss zwischen 2 und 50 Zeichen lang sein.' 
            : 'Last name must be between 2 and 50 characters.' 
        })
      };
    }

    // 8. Birth year validation if provided
    if (fields.geburtsjahr) {
      const birthYear = parseInt(fields.geburtsjahr);
      const currentYear = new Date().getFullYear();
      if (isNaN(birthYear) || birthYear < 1900 || birthYear > currentYear) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            message: language === 'de' 
              ? 'Ungültiges Geburtsjahr.' 
              : 'Invalid birth year.' 
          })
        };
      }
    }
    
    // === END SPAM PROTECTION ===
    
    // Process the form - send email notification
    try {
      await sendEmail(fields, formType, language);
      
      // Return success
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: language === 'de' 
            ? 'Vielen Dank für Ihre Anmeldung!' 
            : 'Thank you for your submission!'
        })
      };
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: language === 'de' 
            ? 'Es ist ein Fehler beim Versenden der E-Mail aufgetreten. Bitte versuchen Sie es später erneut.' 
            : 'An error occurred while sending the email. Please try again later.'
        })
      };
    }
    
  } catch (error) {
    console.error('Form processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.'
      })
    };
  }
};