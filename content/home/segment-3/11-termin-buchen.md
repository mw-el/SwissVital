---
title: "Termin buchen"
layout: "section"
id: "termin-buchen"

# Available light BG Gradients: 
# var(--bg-lightgrey) var(--bg-lightgrey-warm)  var(--bg-lightgrey-cold)  var(--bg-white-gradient)
# Available Layouts: 
# "i2/5, c3/5"  "i3/5, c2/5"  "i1/2, c1/2"  "c2/5, i3/5"  "c3/5, i2/5"  "c1/2, i1/2"  "c1/1"


# Background settings
background_image: ""  # Background image for the section
background_color: "var(--bg-lightgrey-warm)"  # No background color defined
text_color: ""  # Text color

# Foreground Image (Optional)
image: ""  # No foreground image defined
image-shadow: "" # shadow-none – shadow-sm – shadow – shadow-lg – large shadow 

# Primary Button
primary_button_text: ""
primary_button_link: ""
primary_button_background: "var(--sv-primary-darker)"
primary_button_text_color: "var(--sv-offwhite)"
primary_button_border: ""  # Defaults to primary_button_background in the partial

# Secondary Button (Optional)
secondary_button_text: ""
secondary_button_link: ""
secondary_button_background: "rgba(var(--sv-offwhite-rgb), 0.3)"  # 50% transparent off-white
secondary_button_text_color:  "rgba(var(--sv-offwhite-rgb), 0.8)"    # Defaults to `primary_button_background` if left empty
secondary_button_border:  "rgba(var(--sv-offwhite-rgb), 0.3)"      # Defaults to `primary_button_text_color` if left empty (inverted colors)

# Content alignment settings
headline_alignment: "center"
body_text_alignment: "center"
button_alignment: "center"  # Buttons are positioned as a unit (centered by default)

# Button Placement
button_placement: "content"  # Default placement under content

# Grid layout configuration (Full-width content)
grid_layout: "c1/1"  # Default to full-width content

---
 
 Hier kommen Sie ganz einfach zu Ihrem Termin. 
 
 **E-Mail eintragen**, Standort wählen, fertig. 
        
        
{{< termin-formular >}}

