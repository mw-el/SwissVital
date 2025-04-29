/**
 * SwissVital Forms - Improved Dropdown-Utility
 * Provides reusable functions for custom dropdowns in all forms with improved positioning
 */

// Export as a function to the global object (window)
window.initializeDropdown = function(displayId, dropdownId, checkboxName, isSingleChoice = false) {
    const display = document.getElementById(displayId);
    const dropdown = document.getElementById(dropdownId);
    const dropdownContainer = display.closest('.sv-form-floating');
    const checkboxes = dropdown.querySelectorAll(`input[name="${checkboxName}"]`);
    
    // Initial state
    dropdown.style.display = 'none';
    
    // Function to calculate and set dropdown position
    function positionDropdown() {
      // Set dropdown position relative to display element
      dropdown.style.top = display.offsetHeight + 'px';
      dropdown.style.left = '0';
      dropdown.style.width = '100%';
    }
    
    // Toggle behavior
    display.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Toggle dropdown visibility
      const isVisible = dropdown.style.display !== 'none';
      
      // Close all other open dropdowns first
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== dropdown && menu.style.display !== 'none') {
          menu.style.display = 'none';
          const container = menu.closest('.sv-form-floating');
          if (container) container.style.marginBottom = '3rem';
        }
      });
      
      // Toggle this dropdown
      if (isVisible) {
        dropdown.style.display = 'none';
        dropdownContainer.style.marginBottom = '3rem'; // Reset margin
      } else {
        dropdown.style.display = 'block';
        positionDropdown();
        
        // Adjust container margin based on dropdown height
        const dropdownHeight = dropdown.offsetHeight;
        dropdownContainer.style.marginBottom = (dropdownHeight + 20) + 'px';
      }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== display) {
        dropdown.style.display = 'none';
        dropdownContainer.style.marginBottom = '3rem'; // Reset margin
      }
    });
    
    // Stop propagation within dropdown
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Update display text
    function updateDisplay() {
      const selected = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.parentElement.querySelector('label').textContent);
      
      display.textContent = selected.length > 0 
        ? selected.join(', ') 
        : 'Bitte wählen';
    }
    
    // Handle checkbox changes
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
    
    // Handle window resize
    window.addEventListener('resize', () => {
      if (dropdown.style.display !== 'none') {
        positionDropdown();
        
        // Update container margin
        const dropdownHeight = dropdown.offsetHeight;
        dropdownContainer.style.marginBottom = (dropdownHeight + 20) + 'px';
      }
    });
    
    // Initialize display text
    updateDisplay();
  };