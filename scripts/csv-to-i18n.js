// scripts/csv-to-i18n.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Pfade konfigurieren
const CSV_FILE = path.join(__dirname, '../static/translations/form-translations.csv');
const OUTPUT_DIR = path.join(__dirname, '../i18n');

// Sicherstellen, dass das Ausgabeverzeichnis existiert
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Sprachen, die wir konvertieren wollen
const languages = ['de', 'en', 'fr', 'it'];

// Für jede Sprache ein Objekt vorbereiten
const translations = {};
languages.forEach(lang => {
  translations[lang] = {};
});

/**
 * Maskiert TOML-Strings korrekt.
 * - Maskiert Anführungszeichen (")
 * - Maskiert Backslashes (\)
 * - Behandelt Schrägstriche (/) in URLs sicher
 * - Maskiert andere problematische Zeichen
 */
function escapeTOML(str) {
  if (!str) return '';
  
  // Maskiere Backslashes zuerst, da sie für andere Maskierungen verwendet werden
  let escaped = str.replace(/\\/g, '\\\\');
  
  // Maskiere doppelte Anführungszeichen
  escaped = escaped.replace(/"/g, '\\"');
  
  // Besondere Behandlung für HTML-Tags mit href Attributen
  // Wir ersetzen /path mit \\/path um Probleme mit Pfaden zu vermeiden
  escaped = escaped.replace(/(href=["'])\/([^"']+)(["'])/g, '$1\\/$2$3');
  
  return escaped;
}

// CSV einlesen und verarbeiten
fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on('data', (row) => {
    // Kommentarzeilen überspringen (beginnen mit #)
    if (row.key && !row.key.startsWith('#')) {
      // Für jede Sprache den Wert aus der entsprechenden Spalte nehmen
      languages.forEach(lang => {
        translations[lang][row.key] = row[lang] || '';
      });
    }
  })
  .on('end', () => {
    // Für jede Sprache eine TOML-Datei erstellen
    languages.forEach(lang => {
      let tomlContent = '';
      
      // Jede Übersetzung in TOML-Format umwandeln mit korrekter Maskierung
      Object.keys(translations[lang]).forEach(key => {
        const escapedValue = escapeTOML(translations[lang][key]);
        tomlContent += `[${key}]\nother = "${escapedValue}"\n\n`;
      });
      
      // TOML-Datei schreiben
      fs.writeFileSync(path.join(OUTPUT_DIR, `${lang}.toml`), tomlContent);
      console.log(`Datei ${lang}.toml erstellt.`);
    });
    
    console.log('Alle Übersetzungsdateien wurden erfolgreich erstellt!');
  });