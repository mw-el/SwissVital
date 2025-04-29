// formSubmissionProcessing.js - Unified form handler for all SwissVital forms
// Handles validation, spam protection, and forwards to email service
const querystring = require('querystring');
const fetch = require('node-fetch'); // Wird für HTTP-Requests benötigt (ggf. installieren mit: npm i node-fetch)

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
 * Forwards validated form data to the email service
 * @param {object} fields - Form data fields
 * @param {string} formType - Type of form
 * @param {string} language - Language code
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
const sendEmailNotification = async (fields, formType, language) => {
  // Get base URL from environment or construct it from headers
  const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://swissvital.ch';
  
  try {
    // Send the data to the email service
    const response = await fetch(
      `${baseUrl}/.netlify/functions/sendConfirmartonBilingualFragebogen`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          form_type: formType,
          language: language
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email service returned error:', errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error forwarding to email service:', error);
    return false;
  }
};

// Configuration for different form types
const formConfig = {
  'sportler-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon', 'geschlecht']
  },
  'stress-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon', 'stress_level']
  },
  'familiaer-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon']
  },
  'ganzheitlich-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon']
  },
  'individuell-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon']
  },
  'chronisch-survey': {
    requiredFields: ['vorname', 'nachname', 'email', 'telefon']
  }
  // Additional form types can be added here
};

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
    
    // Forward to email service
    const emailSent = await sendEmailNotification(fields, formType, language);
    
    if (emailSent) {
      // Return success
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: language === 'de' 
            ? 'Vielen Dank für Ihre Anmeldung!' 
            : 'Thank you for your submission!'
        })
      };
    } else {
      // Return error if email sending failed
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