/**
 * SwissVital Forms - Centralized Spam Protection & Form Handling Utilities
 * 
 * This file contains common functionality for spam protection and form
 * handling that can be applied to all SwissVital forms.
 */

/**
 * Initialize spam protection on a form
 * @param {string} formId - The ID of the form to protect
 */
function initSpamProtection(formId) {
  // Get the form element
  const form = document.getElementById(formId);
  if (!form) return;
  
  // Generate unique ID
  function generateUniqueId() {
    return 'sv_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  // Set the sv_id field if it exists
  const svIdField = form.querySelector('[name="sv_id"]');
  if (svIdField) svIdField.value = generateUniqueId();
  
  // Set the timestamp if the field exists
  const timestampField = form.querySelector('[name="form_start_time"]');
  if (timestampField) timestampField.value = Date.now();
}

/**
 * Creates a standardized form submission handler
 * 
 * @param {string} formId - The ID of the form element
 * @param {object} options - Configuration options
 * @param {object} options.fieldLabels - Map of field names to display labels
 * @param {string} options.successElementId - ID of the success message element
 * @param {string} options.summaryElementId - ID of the element to show submission summary
 * @param {string} options.emailConfirmElementId - ID of the element to show email confirmation
 * @param {string} options.successMessage - Custom success message
 */
function handleFormSubmit(formId, options = {}) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form type from hidden field
    const formData = new FormData(form);
    const formType = formData.get('form_type');
    
    // Create standard submission object
    const submission = {
      type: formType,
      timestamp: new Date().toISOString(),
      fields: {},
      // Add spam protection data
      spamProtection: {
        sv_id: formData.get('sv_id'),
        form_start_time: formData.get('form_start_time')
      }
    };
    
    // Collect all form fields into the fields object
    for (const [key, value] of formData.entries()) {
      // Skip special fields
      if (['sv_id', 'form_start_time', 'website', 'bot-field', 'form_type'].includes(key)) continue;
      
      // Handle multiple values (for checkboxes/selects with multiple)
      if (key.endsWith('[]')) {
        const cleanKey = key.replace('[]', '');
        if (!submission.fields[cleanKey]) submission.fields[cleanKey] = [];
        submission.fields[cleanKey].push(value);
      } else {
        submission.fields[key] = value;
      }
    }
    
    // Custom success message if provided
    const successMessage = options.successMessage || 'Vielen Dank für Ihre Anmeldung!';
    
    try {
      // Determine if we're in development or production environment
      // In development, the URL should be /netlify/functions/... (without the dot)
      // In production, the URL should be /.netlify/functions/...
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      
      // Determine the appropriate path based on environment
      const functionsPath = isLocalhost ? '/netlify/functions/' : '/.netlify/functions/';
      
      // Call the unified Netlify function with the appropriate path
      const response = await fetch(functionsPath + 'formSubmissionProcessing', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(submission)
      });
      
      // Handle response
      if (response.ok) {
        // Create a summary using the original form data directly
        // This is more reliable than using the processed submission object
        createFormSummary(form, formId, options);
        
        // Show success message
        const successElement = document.getElementById(options.successElementId || `${formId}-success`);
        if (successElement) {
          form.classList.add('d-none');
          successElement.classList.remove('d-none');
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Unbekannter Fehler bei der Formularverarbeitung' };
        }
        // Handle error response
        alert(errorData.message || 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  });
}

/**
 * Creates and displays a summary of the submitted form data
 *
 * @param {HTMLFormElement} form - The form element
 * @param {string} formId - The ID of the form
 * @param {object} options - The options object from handleFormSubmit
 */
function createFormSummary(form, formId, options) {
  // Get the summary element
  const summaryElement = document.getElementById(options.summaryElementId || `${formId}-summary`);
  if (!summaryElement) return;
  
  // Use FormData to get all the form values including arrays
  const fd = new FormData(form);
  const obj = Object.fromEntries(fd.entries());

  let html = '<ul class="list-group">';
  
  // Simple fields that are not arrays
  const simple = ['vorname', 'nachname', 'geburtsjahr', 'email', 'telefon', 'geschlecht', 'sport_frequency', 'recent_injuries', 'pain_after_sport'];
  simple.forEach(k => { 
    if (obj[k]) html += `<li class="list-group-item"><strong>${options.fieldLabels?.[k] || k}:</strong> ${obj[k]}</li>`; 
  });

  // Multiple selection fields (arrays)
  const multi = [
    { name: 'sportarten[]', label: options.fieldLabels?.sportarten || 'Sportarten' },
    { name: 'fruehere_verletzungen[]', label: options.fieldLabels?.fruehere_verletzungen || 'Frühere Verletzungen' },
    { name: 'koerperregionen[]', label: options.fieldLabels?.koerperregionen || 'Körperregionen' },
    { name: 'rueckruf_zeiten[]', label: options.fieldLabels?.rueckruf_zeiten || 'Rückrufzeiten' }
  ];

  multi.forEach(item => {
    const arr = fd.getAll(item.name);
    if (arr.length) html += `<li class="list-group-item"><strong>${item.label}:</strong> ${arr.join(', ')}</li>`;
  });

  // Free text fields
  if (obj.freitext) html += `<li class="list-group-item"><strong>${options.fieldLabels?.freitext || 'Freitext'}:</strong> ${obj.freitext}</li>`;
  if (obj.zusatzinformationen) html += `<li class="list-group-item"><strong>${options.fieldLabels?.zusatzinformationen || 'Zusatzinformationen'}:</strong> ${obj.zusatzinformationen}</li>`;

  html += '</ul>';

  // Update summary content
  summaryElement.innerHTML = html;
  
  // Update email confirmation if it exists
  const emailConfirmElement = document.getElementById(options.emailConfirmElementId || `${formId}-emailConfirm`);
  if (emailConfirmElement && obj.email) {
    emailConfirmElement.textContent = `Wir senden eine Bestätigung an: ${obj.email || ''}`;
  }
}

// Export functions to make them globally available
window.initSpamProtection = initSpamProtection;
window.handleFormSubmit = handleFormSubmit;