/**
 * SwissVital Forms - Dropdown-Utility
 * Bietet wiederverwendbare Funktionen für Custom-Dropdowns in allen Formularen
 */

// Wird als Funktion in das globale Objekt (window) exportiert
window.initializeDropdown = function(displayId, dropdownId, checkboxName, isSingleChoice = false) {
  const display = document.getElementById(displayId);
  const dropdown = document.getElementById(dropdownId);
  const checkboxes = dropdown.querySelectorAll(`input[name="${checkboxName}"]`);
  
  // Toggle-Verhalten
  display.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  // Schließen bei Klick außerhalb
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== display) {
      dropdown.style.display = 'none';
    }
  });
  
  // Propagation stoppen
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Anzeige aktualisieren
  function updateDisplay() {
    const selected = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.parentElement.querySelector('label').textContent);
    
    display.textContent = selected.length > 0 
      ? selected.join(', ') 
      : 'Bitte wählen';
  }
  
  // Checkbox-Änderungen
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      if (isSingleChoice) {
        checkboxes.forEach(cb => {
          if (cb !== checkbox) cb.checked = false;
        });
      }
      updateDisplay();
    });
  });
};