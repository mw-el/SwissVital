"""
This script rebuilds the content directory for a Hugo website from CSV files generated earlier.
It assumes that the CSV files are stored under a timestamp directory inside a CSV folder, and that
the existing content directory is located at /content under the root of your Hugo website.

Folder structure example:

    /.../SwissVitalDev/               <-- Hugo website root (main base directory)
        ├── content/                   <-- Existing content directory (to be backed up)
        └── csv/
             └── <timestamp>/          <-- Timestamp directory containing language folders
                  ├── de/              <-- CSV files for German content, preserving the folder tree
                  ├── en/
                  ├── fr/
                  └── it/

Workflow:
1. A Tkinter GUI is used to select the CSV timestamp directory. If the user selects a language
   subdirectory (e.g. "de"), the script adjusts the path to the parent timestamp directory.
2. The script derives the Hugo website root by locating the "csv" folder in the selected path and
   taking its parent.
3. If a "content" directory exists at the Hugo website root, it is renamed to ".content-bak-<current_timestamp>"
   as a backup (at the same level as the original).
4. A new "content" directory is created in the Hugo website root.
5. The script processes CSV files from the "de" subdirectory of the selected timestamp directory,
   walking the folder tree while ignoring hidden files/directories.
6. For each CSV file:
   - The CSV file is read; it must have a header row: ["key", "de", "en", "fr", "it"] and subsequent
     rows where each row represents a content key.
   - All rows except the one with key "body_text" form the YAML frontmatter.
   - The row with key "body_text" provides the Markdown body.
7. For each CSV file processed, Markdown files are created for all languages (de, en, fr, it) under the
   new "content" directory, preserving the relative folder structure. The output Markdown file is named by
   replacing the ".csv" extension of the original CSV file with ".md".
8. When building the YAML frontmatter, the script uses the CSV file's data verbatim, without adding
   or removing any quotes. This ensures that fields like "date" remain exactly as they were originally.
9. Detailed terminal output is printed to indicate progress and actions.
"""

import os
import csv
import tkinter as tk
from tkinter import filedialog
import datetime
import sys

def derive_site_root(selected_path):
    """
    Derives the Hugo website root from the selected CSV timestamp directory.
    It looks for the "csv" folder in the path and takes its parent as the site root.
    For example, if selected_path is:
      /home/matthias/.../SwissVitalDev/SwissVital/csv/20250210-001226
    then the site root will be:
      /home/matthias/.../SwissVitalDev/SwissVital
    """
    norm_path = os.path.normpath(selected_path)
    parts = norm_path.split(os.sep)
    if "csv" in parts:
        csv_index = parts.index("csv")
        if csv_index == 0:
            site_root = os.sep
        else:
            site_root = os.sep + os.path.join(*parts[1:csv_index])
        return site_root
    else:
        return os.path.dirname(os.path.dirname(selected_path))

# -------------------------- GUI: Select CSV Timestamp Directory -------------------------- #
print("Starting script to rebuild content directory from CSV files...")
root = tk.Tk()
root.withdraw()

# Default CSV folder (adjust as necessary).
default_csv_dir = "/home/matthias/_1_SYNOLOGY/MW-D/DOCS/___SwissVitalDev/SwissVital/csv"
timestamp_dir = filedialog.askdirectory(
    title="Select CSV timestamp directory from CSV folder structure",
    initialdir=default_csv_dir
)
if not timestamp_dir:
    print("No CSV timestamp directory selected. Exiting.")
    sys.exit(1)
print(f"Selected CSV timestamp directory: {timestamp_dir}")

# -------------------------- Adjust Selected Directory if Necessary -------------------------- #
# If the selected directory ends with a language code (e.g., "de", "en", "fr", "it"),
# adjust to its parent (the timestamp directory).
languages = ["de", "en", "fr", "it"]
basename = os.path.basename(os.path.normpath(timestamp_dir))
if basename in languages:
    timestamp_dir = os.path.dirname(timestamp_dir)
    print(f"Adjusted selected directory to its parent timestamp directory: {timestamp_dir}")

# -------------------------- Derive Hugo Website Root -------------------------- #
site_root = derive_site_root(timestamp_dir)
print(f"Derived Hugo website root (site root): {site_root}")

# -------------------------- Locate Existing Content Directory -------------------------- #
existing_content_dir = os.path.join(site_root, "content")
print(f"Existing content directory: {existing_content_dir}")

# -------------------------- Backup Existing Content Directory -------------------------- #
current_timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
if os.path.isdir(existing_content_dir):
    backup_content_dir = os.path.join(site_root, f".content-bak-{current_timestamp}")
    try:
        os.rename(existing_content_dir, backup_content_dir)
        print(f"Renamed existing content directory to backup: {backup_content_dir}")
    except Exception as e:
        print("ERROR: Renaming content directory:", e)
        sys.exit(1)
else:
    print("No existing content directory found at site root. No backup created.")

# -------------------------- Create New Content Directory -------------------------- #
new_content_dir = os.path.join(site_root, "content")
try:
    os.makedirs(new_content_dir, exist_ok=True)
    print(f"Created new content directory: {new_content_dir}")
except Exception as e:
    print("ERROR: Creating new content directory:", e)
    sys.exit(1)

# -------------------------- Determine CSV Source Directory -------------------------- #
# The CSV timestamp directory is expected to contain language subdirectories.
# We require that there is a "de" folder inside the timestamp directory.
csv_source_dir = os.path.join(timestamp_dir, "de")
print(f"Looking for CSV source directory (German) at: {csv_source_dir}")
if not os.path.isdir(csv_source_dir):
    print(f"ERROR: Source CSV directory does not exist: {csv_source_dir}")
    print("Please ensure the selected CSV timestamp directory contains language folders (e.g., 'de').")
    sys.exit(1)
print(f"Found CSV source directory: {csv_source_dir}")

# -------------------------- Process CSV Files from the 'de' Subdirectory -------------------------- #
file_count = 0
row_count = 0

for root_dir, dirs, files in os.walk(csv_source_dir):
    # Exclude hidden directories.
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    for filename in files:
        if filename.startswith('.') or not filename.endswith(".csv"):
            continue

        file_count += 1
        csv_file_path = os.path.join(root_dir, filename)
        rel_path = os.path.relpath(csv_file_path, start=csv_source_dir)
        print(f"\nProcessing CSV file: {rel_path}")

        # Initialize dictionaries for frontmatter and body text per language.
        frontmatters = {lang: {} for lang in languages}
        body_texts = {lang: "" for lang in languages}

        # -------------------------- Read CSV File -------------------------- #
        try:
            with open(csv_file_path, "r", encoding="utf-8") as csvfile:
                reader = csv.reader(csvfile, quoting=csv.QUOTE_ALL)
                header = next(reader, None)
                if header is None:
                    print(f"WARNING: Empty CSV file: {csv_file_path}")
                    continue
                # Expected header: ["key", "de", "en", "fr", "it"]
                for row in reader:
                    if not row:
                        continue
                    key = row[0].strip()
                    for i, lang in enumerate(languages, start=1):
                        value = row[i].strip() if i < len(row) else ""
                        if key == "body_text":
                            body_texts[lang] = value
                        else:
                            frontmatters[lang][key] = value
                        row_count += 1
        except Exception as e:
            print(f"ERROR: Reading CSV file {csv_file_path}\n{e}")
            continue

        # -------------------------- Determine Output Filename and Directory -------------------------- #
        base_filename = filename[:-4] if filename.endswith(".csv") else os.path.splitext(filename)[0]
        output_filename = base_filename if base_filename.endswith(".md") else base_filename + ".md"
        rel_dir = os.path.dirname(rel_path)
        print(f"CSV file will be converted to Markdown file: {output_filename} (relative directory: {rel_dir})")

        # -------------------------- Create Markdown Files for Each Language -------------------------- #
        for lang in languages:
            lang_output_dir = os.path.join(new_content_dir, lang, rel_dir)
            try:
                os.makedirs(lang_output_dir, exist_ok=True)
            except Exception as e:
                print(f"ERROR: Creating directory {lang_output_dir}\n{e}")
                continue

            output_file_path = os.path.join(lang_output_dir, output_filename)
            print(f"Writing Markdown for {lang}: {output_file_path}")

            # Use the CSV data verbatim.
            frontmatter_lines = ["---"]
            for key, value in frontmatters[lang].items():
                # Output exactly what was stored in the CSV.
                frontmatter_lines.append(f"{key}: {value}")
            frontmatter_lines.append("---")
            markdown_content = "\n".join(frontmatter_lines) + "\n\n" + body_texts[lang] + "\n"

            try:
                with open(output_file_path, "w", encoding="utf-8") as mdfile:
                    mdfile.write(markdown_content)
                print(f"Successfully wrote Markdown file for {lang}: {output_file_path}")
            except Exception as e:
                print(f"ERROR: Writing Markdown file for {lang}: {output_file_path}\n{e}")

print(f"\nFinished processing {file_count} CSV file(s) with {row_count} data row(s).")
print(f"New content directory created at: {new_content_dir}")

