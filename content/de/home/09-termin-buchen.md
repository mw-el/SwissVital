---
background_color: "var(--sv-offwhite)"
background_image: ""
body_text_alignment: "center"
button_alignment: "center"
button_placement: "center"
content_width: "12"    # Anzahl Zwölftel
image_width:   "0"    # Anzahl Zwölftel
image_position: ""  # "left" oder "right"
headline_alignment: "center"
id: "termin-buchen"
image: ""
image-shadow: ""  # default to "shadow" for a simple drop-shadow effect
layout: "section"
text_color: "var(--sv-richblack)"
pre_headline: "" 
title: "Termin buchen"
# ------------------------------------------------------------------------------
# Available button classes (solid & skeleton):
#   sv-btn-red            | sv-btn-red-sk
#   sv-btn-pumpkin        | sv-btn-pumpkin-sk
#   sv-btn-green          | sv-btn-green-sk
#   sv-btn-lightblue      | sv-btn-lightblue-sk
#   sv-btn-moonstone      | sv-btn-moonstone-sk
#   sv-btn-royalblue      | sv-btn-royalblue-sk
#   sv-btn-richblack      | sv-btn-richblack-sk
#   sv-btn-offwhite       | sv-btn-offwhite-sk
#   sv-btn-rose           | sv-btn-rose-sk
#   sv-btn-yellow         | sv-btn-yellow-sk
#
#   btn-cap (Text Grossbuchstaben)
# ------------------------------------------------------------------------------
primary_button_class: "sv-btn-royalblue btn-cap"
primary_button_link: "#termin-buchen"
primary_button_text: ""

secondary_button_class: ""
secondary_button_link: ""
secondary_button_text: ""
partial: "full-bg.html"
---
{{< limit-width >}}

Hier kommen Sie ganz einfach zu Ihrem Termin. 

**E-Mail eintragen**, Standort wählen, ab die Post.

{{< spacer >}}

{{< /limit-width >}}

{{< form-booking-de >}}
