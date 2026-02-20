/**
 * ZAHID-KING-MD - Multi-Language Support System
 * This module loads the translation strings based on the configuration.
 */

const { LANGUAGE } = require('../../config');
const { existsSync, readFileSync } = require('fs');
const path = require('path');

// 1. Determine the language file path
const langFilePath = path.join(__dirname, 'lang', `${LANGUAGE}.json`);
const defaultFilePath = path.join(__dirname, 'lang', 'english.json');

// 2. Load the JSON data (Fallback to English if the selected language doesn't exist)
let json;
try {
    if (existsSync(langFilePath)) {
        json = JSON.parse(readFileSync(langFilePath, 'utf8'));
    } else {
        console.log(`[!] Language file for "${LANGUAGE}" not found. Falling back to English.`);
        json = JSON.parse(readFileSync(defaultFilePath, 'utf8'));
    }
} catch (error) {
    console.error("Error loading language files:", error.message);
    // Ultimate fallback to prevent bot crash
    json = { STRINGS: {} };
}

/**
 * Get a specific string from the language file
 * @param {string} file - The category/key in the JSON
 * @returns {object} - The string or object for that key
 */
function getString(file) { 
    return json['STRINGS'][file] || {}; 
}

module.exports = { 
    language: json, 
    getString: getString 
};
