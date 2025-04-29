/**
 * Centralized form submission processing handler for Netlify Functions
 * 
 * This function processes all form submissions from the website and:
 * 1. Validates the submission data
 * 2. Checks for spam indicators
 * 3. Sends confirmation emails
 * 4. Returns appropriate status codes and messages
 */

// Import the email sender function
const emailSender = require('./sendConfirmartonBilingualFragebogen');

exports.handler = async (event, context) => {
  // Set CORS headers for browser clients
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Log the request details for debugging
  console.log('Received request:', { 
    method: event.httpMethod,
    path: event.path,
    headers: event.headers
  });
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }
  
  // Parse submission data
  let submission;
  try {
    submission = JSON.parse(event.body);
    console.log('Form submission received:', {
      type: submission.type,
      timestamp: submission.timestamp,
      formData: JSON.stringify(submission.fields).substring(0, 100) + '...' // Log truncated for brevity
    });
  } catch (error) {
    console.error('Error parsing submission data:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid submission data' })
    };
  }
  
  // Basic validation
  if (!submission || !submission.fields || !submission.type) {
    console.error('Missing required submission data');
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Missing required submission data' })
    };
  }
  
  // Simple spam check
  if (isSpam(submission)) {
    console.warn('Spam submission detected');
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ message: 'Submission rejected' })
    };
  }
  
  try {
    // Try to send confirmation emails
    console.log('Sending confirmation emails for form type:', submission.type);
    
    try {
      // Call the email sender function
      const result = await emailSender.sendConfirmationEmails(submission.fields, submission.type);
      console.log('Email sending result:', result);
    } catch (emailError) {
      // Log error but don't fail the submission completely
      console.error('Error sending confirmation emails:', emailError);
      // Continue processing despite email error
    }
    
    // Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Form submission processed successfully',
        success: true
      })
    };
  } catch (error) {
    console.error('Error processing submission:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message,
        success: false
      })
    };
  }
};

/**
 * Basic spam detection function
 * 
 * @param {Object} submission - The form submission data
 * @returns {boolean} True if spam is detected, false otherwise
 */
function isSpam(submission) {
  // Check for missing spam protection data
  if (!submission.spamProtection) {
    console.warn('No spam protection data provided');
    return true;
  }
  
  // Ensure sv_id is present and valid
  if (!submission.spamProtection.sv_id || 
      typeof submission.spamProtection.sv_id !== 'string' ||
      !submission.spamProtection.sv_id.startsWith('sv_')) {
    console.warn('Invalid sv_id');
    return true;
  }
  
  // Check for very quick submissions (< 3 seconds)
  if (submission.spamProtection.form_start_time) {
    const submissionTime = Date.now();
    const formStartTime = parseInt(submission.spamProtection.form_start_time, 10);
    
    if (!isNaN(formStartTime) && (submissionTime - formStartTime < 3000)) {
      console.warn('Submission too quick', 
        { start: formStartTime, submit: submissionTime, diff: submissionTime - formStartTime });
      return true;
    }
  }
  
  // Check for hidden honeypot field
  if (submission.fields && submission.fields.website) {
    console.warn('Honeypot field filled');
    return true;
  }
  
  return false;
}