# Documentation: SwissVital Form System Architecture and Development

## 1. System Overview

The SwissVital clinic website uses a dynamic form system built on Hugo (version 145) with Bootstrap 5. The system processes various questionnaires where users provide information about their medical needs and contact details. After submission, the data must be:

1. Displayed in a confirmation window with properly labeled fields
2. Sent via email to both the user and clinic staff
3. Processed securely with spam protection

## 2. Files and Components

### 2.1 Frontend Components

- **form-assets.html**: Central JavaScript utilities shared across all forms
- **form-sportler-de.html**: Athlete questionnaire form (example implementation)
- **form-test-survey.html**: Simplified test form for development
- **Various form templates**: Additional questionnaires (stress, chronic conditions, etc.)

### 2.2 Backend Components

- **formSubmissionProcessing.js**: Netlify function that handles form submissions
- **sendConfirmationBilingualFragebogen.js**: Processes emails in both German and English
- **spam-protection-fields.html**: Partial for spam protection measures

## 3. Key Functions and Methods

### 3.1 Form Processing Pipeline

1. **initSpamProtection(formId)**
   
   - Generates unique IDs for submissions
   - Sets timestamps to detect bot submissions

2. **handleFormSubmit(formId, options)**
   
   - Collects form data into a structured object
   - Handles form submission to backend function
   - Displays confirmation message upon success
   - Initializes with field labels from Hugo template

3. **createFormSummary(form, formId, options)**
   
   - Creates HTML summary of submitted form data
   - Uses field labels for proper display in confirmation window
   - Processes different field types (simple fields, arrays, free text)

### 3.2 Backend Processing

1. **formSubmissionProcessing.handler**
   
   - Validates submission data
   - Checks for spam indicators
   - Calls email sending function

2. **sendConfirmationEmails**
   
   - Sends confirmation to user with submitted data
   - Sends notification to clinic staff
   - Supports bilingual emails (German/English)

## 4. Problem Identification and Solution

### 4.1 The Problem

We encountered an issue where field labels in the confirmation window were either:

1. Displayed in lowercase (e.g., "vorname: Matthias" instead of "Vorname: Matthias")
2. Completely missing, showing only the raw field name

Through debugging, we identified two core issues:

1. **Double initialization**: The form handler was being initialized twice - once in form-assets.html and again in the form's specific JavaScript. The second initialization overwrote the field labels provided by the first.

2. **String vs Object**: Field labels were passed as a JSON string rather than a JavaScript object, preventing access to label properties.

### 4.2 The Solution

1. **Removed duplicate initialization**: Eliminated the redundant handleFormSubmit call in the form-specific JavaScript:
   
   ```javascript
   // REMOVED:
   if (typeof window.handleFormSubmit === 'function') {
    window.handleFormSubmit('form-sportler-survey', {
      successElementId: 'form-sportler-survey-success',
      summaryElementId: 'form-sportler-survey-summary',
      emailConfirmElementId: 'form-sportler-survey-emailConfirm'
    });
   }
   ```

2. **Added JSON parsing for field labels**: Modified handleFormSubmit to parse field labels if provided as a string:
   
   ```javascript
   // Parse fieldLabels if it's a string
   if (options.fieldLabels && typeof options.fieldLabels === 'string') {
    try {
      options.fieldLabels = JSON.parse(options.fieldLabels);
      console.log('Parsed field labels:', options.fieldLabels);
    } catch (error) {
      console.error('Error parsing field labels:', error);
    }
   }
   ```

## 5. Current Status and Next Steps

### 5.1 Current Status

- Form submissions now correctly display field labels in confirmation windows
- Field labels are properly passed between components
- The test form works as expected with proper display of:
  - Simple text fields
  - Single-choice (radio button) fields
  - Multiple-choice (checkbox) fields
  - Free text fields

### 5.2 Next Steps

1. **Apply to all forms**: Update all questionnaire forms to remove duplicate initializations
2. **Standardize field naming**: Establish consistent naming conventions across all forms
3. **Create form generator**: Consider implementing a form generator that produces forms based on a configuration object
4. **Enhance email templates**: Improve email templates to leverage the same field labels system
5. **Address font loading issues**: Fix font loading errors (404s for Questrial-Regular.ttf and ProzaLibre-Bold.ttf)
6. **Implement form validation**: Add comprehensive client-side validation
7. **Enhance accessibility**: Ensure all forms meet WCAG standards

## 6. Development Guidelines

When creating new forms:

1. **Field Labels**: Always provide proper field labels in the Hugo template:
   
   ```html
   {{ partial "form-assets.html" (dict
    "FormID" "form-name"
    "FieldLabels" (dict
      "field1" "Proper Label 1"
      "field2" "Proper Label 2"
      <!-- etc. -->
    )
   ) }}
   ```

2. **Form IDs**: Use consistent ID patterns for form elements:
   
   - Form ID: `form-[type]-survey`
   - Success message: `form-[type]-survey-success`
   - Summary element: `form-[type]-survey-summary`
   - Email confirmation: `form-[type]-survey-emailConfirm`

3. **Field Names**: For array-type inputs (checkboxes), use the [] suffix:
   
   ```html
   <input type="checkbox" name="options[]" value="Option A">
   ```

4. **Avoid Double Initialization**: Never initialize the form handler in form-specific JavaScript; rely on the central initialization in form-assets.html.

By following these guidelines, the form system will maintain consistency across all questionnaires while allowing for form-specific customization.
