"""
This script extracts the YAML frontmatter and Markdown body from multilingual Markdown
files and stores the results in CSV files that preserve the frontmatter formatting.
It ensures that:
  • Frontmatter values (including multiline values) are stored already formatted as they
    should appear in the final Markdown. Single-line values are wrapped in double quotes,
    and multiline values use the YAML literal block style.
  • In text fields (frontmatter and body), double quotes that are not part of code segments
    are replaced with Swiss guillemets.
  • For each source Markdown file (found in the default language folder), a CSV file is created
    in a corresponding folder under an output directory (CSV/(timestamp)/de/...).
  • Any missing translations (i.e. if a file is not found for a language) or errors during
    processing are logged in a file named ".creation_log.md" placed in the CSV timestamp folder.
  
Workflow:
1. A Tkinter GUI prompts the user to select the base directory containing language folders.
   The default directory is set to the default language folder (e.g. .../content/de).
2. The script then determines the folders for all languages (de, en, fr, it) and walks through
   the default language folder.
3. For each Markdown file found, it attempts to read the corresponding file in each language.
4. The YAML frontmatter is extracted (via yaml.safe_load) and the Markdown body is captured.
5. Each frontmatter value is processed:
     - Non-code double quotes are replaced with Swiss guillemets.
     - If the value is multiline, it is formatted using literal block style.
     - Otherwise, it is wrapped in double quotes.
6. The processed values are stored in a CSV file (one per Markdown file) with rows for each key.
7. Any file that is missing in one or more languages, or any errors during reading/writing,
   are logged to a creation log.
8. At the end, a .creation_log.md file is written in the CSV timestamp directory with the log entries.
"""

import os
import yaml
import csv
import tkinter as tk
from tkinter import filedialog
import datetime
import re

def replace_non_code_quotes(text):
    """
    Replace double quotes in text (that are not inside backtick-delimited code segments)
    with Swiss guillemets. In non-code segments, alternating double quotes are replaced:
      first occurrence -> «, second occurrence -> »
    """
    # Split text by code segments (backticks)
    parts = re.split(r'(`+.*?`+)', text)
    new_parts = []
    for part in parts:
        # If part is a code segment (starts and ends with backticks), leave it unchanged.
        if part.startswith("`") and part.endswith("`"):
            new_parts.append(part)
        else:
            toggle = False
            replaced = ""
            for char in part:
                if char == '"':
                    if not toggle:
                        replaced += "«"
                        toggle = True
                    else:
                        replaced += "»"
                        toggle = False
                else:
                    replaced += char
            new_parts.append(replaced)
    return "".join(new_parts)

def format_yaml_value(value):
    """
    Formats a YAML value for CSV storage.
    - Replaces double quotes (outside of code segments) with Swiss guillemets.
    - For multiline values, returns a literal block string with proper indentation.
    - For single-line values, wraps the processed text in double quotes.
    """
    if not isinstance(value, str):
        value = str(value)
    # Replace double quotes outside code segments.
    value = replace_non_code_quotes(value)
    if "\n" in value:
        lines = value.splitlines()
        indented = "\n".join("  " + line for line in lines)
        return "|\n" + indented
    else:
        return f'"{value}"'

def extract_frontmatter_and_body(content):
    """
    Extracts the YAML frontmatter and Markdown body from a Markdown file.
    Returns a tuple: (frontmatter_dict, body_text).
    If extraction fails, returns an empty dict and the full content.
    """
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) > 2:
            try:
                frontmatter = yaml.safe_load(parts[1])
                if frontmatter is None:
                    frontmatter = {}
                body = parts[2].strip()
                return frontmatter, body
            except yaml.YAMLError as e:
                log_entries.append(f"YAML error: {e}")
                return {}, content
    return {}, content

# Global list to store log messages.
log_entries = []

# -------------------------- GUI: Select Base Directory -------------------------- #
root = tk.Tk()
root.withdraw()
default_dir = "/home/matthias/_1_SYNOLOGY/MW-D/DOCS/___SwissVitalDev/SwissVital/content/de"
base_path = filedialog.askdirectory(
    title="Select base directory containing language folders",
    initialdir=default_dir
)
if not base_path:
    log_entries.append("No directory selected. Exiting.")
    print("No directory selected. Exiting.")
    exit(1)
print("Selected base directory:", base_path)

# If a language folder is selected, adjust to its parent.
lang_codes = {"de", "en", "fr", "it"}
if os.path.basename(base_path) in lang_codes:
    base_path = os.path.dirname(base_path)
    print("Adjusted base directory to parent:", base_path)

# -------------------------- Define Language Directories -------------------------- #
base_dirs = { lang: os.path.join(base_path, lang) for lang in lang_codes }
for lang, path in base_dirs.items():
    print(f"Language '{lang}' directory: {path}")

source_lang = "de"
source_dir = base_dirs[source_lang]

# -------------------------- Create Output CSV Directory with Timestamp -------------------------- #
timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
# The output structure is: (parent of base_path)/csv/(timestamp)/de/...
output_csv_base = os.path.join(os.path.dirname(base_path), "csv", timestamp)
print("Output CSV base directory will be:", output_csv_base)
os.makedirs(output_csv_base, exist_ok=True)

# -------------------------- Process Markdown Files and Create CSV Files -------------------------- #
file_count = 0
total_rows = 0

# Walk through the default language (de) folder.
for root_dir, dirs, files in os.walk(source_dir):
    # Exclude hidden directories.
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    for filename in files:
        # Skip hidden files and non-Markdown files.
        if filename.startswith('.') or not filename.endswith(".md"):
            continue

        file_count += 1
        file_path_de = os.path.join(root_dir, filename)
        rel_path = os.path.relpath(file_path_de, start=source_dir)
        print(f"\nProcessing file: {rel_path}")

        # Dictionary to hold extracted (frontmatter, body) per language.
        languages_data = {}
        for lang, lang_dir in base_dirs.items():
            file_path = os.path.join(lang_dir, rel_path)
            if os.path.exists(file_path):
                print(f"Reading {lang} file: {file_path}")
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    frontmatter, body = extract_frontmatter_and_body(content)
                    languages_data[lang] = (frontmatter, body)
                except Exception as e:
                    error_msg = f"Error reading file for {lang}: {file_path}\n{e}"
                    print(error_msg)
                    log_entries.append(error_msg)
                    languages_data[lang] = ({}, "")
            else:
                msg = f"File not found for {lang}: {file_path}"
                print(msg)
                log_entries.append(msg)
                languages_data[lang] = ({}, "")

        # Collect all frontmatter keys from all languages.
        all_keys = set()
        for data in languages_data.values():
            all_keys.update(data[0].keys())
        all_keys.add("body_text")
        # Sort keys; ensure 'body_text' comes last.
        sorted_keys = sorted(k for k in all_keys if k != "body_text")
        if "body_text" in all_keys:
            sorted_keys.append("body_text")
        print("Extracted keys:", sorted_keys)

        # Build CSV rows.
        csv_rows = [["key", "de", "en", "fr", "it"]]
        for key in sorted_keys:
            row = [key]
            for lang in ["de", "en", "fr", "it"]:
                if key == "body_text":
                    # For body text, replace non-code quotes (do not wrap in extra quotes).
                    value = replace_non_code_quotes(languages_data[lang][1])
                else:
                    raw_value = languages_data[lang][0].get(key, "")
                    value = format_yaml_value(raw_value)
                row.append(value)
            csv_rows.append(row)
            total_rows += 1

        # Create output directory structure replicating source folder tree.
        output_file_dir = os.path.join(output_csv_base, source_lang, os.path.dirname(rel_path))
        os.makedirs(output_file_dir, exist_ok=True)
        # CSV file name: original filename with '.csv' appended.
        output_csv_filename = filename + ".csv"
        output_csv_path = os.path.join(output_file_dir, output_csv_filename)
        print(f"Writing CSV file to: {output_csv_path}")

        try:
            with open(output_csv_path, "w", encoding="utf-8", newline="") as csvfile:
                writer = csv.writer(csvfile, quoting=csv.QUOTE_ALL)
                writer.writerows(csv_rows)
        except Exception as e:
            error_msg = f"Error writing CSV file: {output_csv_path}\n{e}"
            print(error_msg)
            log_entries.append(error_msg)

print(f"\nFinished processing {file_count} file(s) with {total_rows} data row(s).")

# -------------------------- Write Creation Log -------------------------- #
log_file_path = os.path.join(output_csv_base, ".creation_log.md")
try:
    with open(log_file_path, "w", encoding="utf-8") as log_file:
        log_file.write("# Creation Log\n\n")
        for entry in log_entries:
            log_file.write(f"- {entry}\n")
    print(f"Creation log written to: {log_file_path}")
except Exception as e:
    print("Error writing creation log:", e)
