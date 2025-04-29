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
    
    // Call the unified Netlify function
    try {
      const response = await fetch('/.netlify/functions/formSubmissionProcessing', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(submission)
      });
      
      // Handle response
      if (response.ok) {
        // Show success message
        const successElement = document.getElementById(options.successElementId || `${formId}-success`);
        if (successElement) {
          form.classList.add('d-none');
          successElement.classList.remove('d-none');
          
          // If there's a summary element, populate it
          const summaryElement = document.getElementById(options.summaryElementId || `${formId}-summary`);
          if (summaryElement) {
            let html = '<ul class="list-group">';
            for (const [key, value] of Object.entries(submission.fields)) {
              const label = options.fieldLabels?.[key] || key;
              if (Array.isArray(value)) {
                html += `<li class="list-group-item"><strong>${label}:</strong> ${value.join(', ')}</li>`;
              } else if (value) {
                html += `<li class="list-group-item"><strong>${label}:</strong> ${value}</li>`;
              }
            }
            html += '</ul>';
            summaryElement.innerHTML = html;
          }
          
          // If there's an email confirmation element, update it
          const emailConfirmElement = document.getElementById(options.emailConfirmElementId || `${formId}-emailConfirm`);
          if (emailConfirmElement && submission.fields.email) {
            emailConfirmElement.textContent = `Wir senden eine Bestätigung an: ${submission.fields.email}`;
          }
        }
      } else {
        const errorData = await response.json();
        // Handle error response
        alert(errorData.message || 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  });
}

// Export functions to make them globally available
window.initSpamProtection = initSpamProtection;
window.handleFormSubmit = handleFormSubmit;