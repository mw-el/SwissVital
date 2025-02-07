import csv
import os

# Determine the directory in which this script resides.
script_dir = os.path.dirname(os.path.abspath(__file__))

# Build paths relative to the script location:
# The assets folder is one level up and then in "assets".
csv_file = os.path.join(script_dir, "..", "assets", "translations_booking-form-standard.csv")
# The i18n folder is also one level up (in the project root).
i18n_dir = os.path.join(script_dir, "..", "i18n")

# Ensure the i18n directory exists.
os.makedirs(i18n_dir, exist_ok=True)

# Open the CSV file using a comma delimiter.
with open(csv_file, newline='', encoding="utf-8") as f:
    reader = csv.reader(f, delimiter=",")
    headers = next(reader)  # headers: key, de, en, fr, it

    # Initialize empty lists for each language (skip the "key" column)
    translations = {lang: [] for lang in headers[1:]}
    
    for row in reader:
        key = row[0]
        for i, lang in enumerate(headers[1:], 1):
            # Use the value if present; fallback to an empty string if missing.
            value = row[i] if i < len(row) else ""
            translations[lang].append(f'[{key}]\nother = "{value}"\n')

# Write the TOML files for each language in the i18n directory.
for lang, content in translations.items():
    filepath = os.path.join(i18n_dir, f"{lang}.toml")
    with open(filepath, "w", encoding="utf-8") as toml_file:
        toml_file.writelines(content)

print("✅ Translation TOML files generated successfully!")
