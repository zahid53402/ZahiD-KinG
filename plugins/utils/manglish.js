/**
 * ZAHID-KING-MD - Manglish & Malayalam Converter
 * This module handles transliteration between Malayalam script and Roman text.
 */

const axios = require("axios");

/**
 * Converts Malayalam Script to Romanized Manglish
 */
const malayalamToManglish = (text) => {
  if (!text) return "";

  // Character Mappings (Vowels, Consonants, Modifiers)
  const vowels = { "അ": "a", "ആ": "aa", "ഇ": "i", "ഈ": "ee", "ഉ": "u", "ഊ": "oo", "ഋ": "ru", "എ": "e", "ഏ": "e", "ഐ": "ai", "ഒ": "o", "ഓ": "o", "ഔ": "au" };
  const doubleConsonants = { "ക്ക": "kk", "ഗ്ഗ": "gg", "ങ്ങ": "ng", "ച്ച": "cch", "ജ്ജ": "jj", "ഞ്ഞ": "nj", "ട്ട": "tt", "ണ്ണ": "nn", "ത്ത": "tth", "ദ്ദ": "ddh", "ദ്ധ": "ddh", "ന്ന": "nn", "ന്ത": "nth", "ങ്ക": "nk", "ണ്ട": "nd", "ബ്ബ": "bb", "പ്പ": "pp", "മ്മ": "mm", "യ്യ": "yy", "ല്ല": "ll", "വ്വ": "vv", "ശ്ശ": "sh", "സ്സ": "s", "ക്സ": "ks", "ഞ്ച": "nch", "ക്ഷ": "ksh", "മ്പ": "mp", "റ്റ": "tt", "ന്റ": "nt", "ന്ത്യ": "nthy" };
  const consonants = { "ക": "k", "ഖ": "kh", "ഗ": "g", "ഘ": "gh", "ങ": "ng", "ച": "ch", "ഛ": "chh", "ജ": "j", "ഝ": "jh", "ഞ": "nj", "ട": "d", "ഠ: "dh", "ഡ": "d", "ഢ": "dd", "ണ": "n", "ത": "th", "ഥ": "th", "ദ": "d", "ധ": "dh", "ന": "n", "പ": "p", "ഫ": "ph", "ബ": "b", "ഭ": "bh", "മ": "m", "യ": "y", "ര": "r", "ല": "l", "വ": "v", "ശ": "sh", "ഷ": "sh", "സ": "s", "ഹ": "h", "ള": "l", "ഴ: "zh", "റ": "r" };
  const chills = { "ല്": "l", "ള്": "l", "ണ്": "n", "ന്": "n", "ര്": "r", "ക്ക്": "k" };
  const modifiers = { "ു്": "u", "ാ": "aa", "ി": "i", "ീ": "ee", "ു": "u", "ൂ": "oo", "ൃ": "ru", "െ": "e", "േ": "e", "ൈ": "y", "ൊ": "o", "ോ": "o", "ൌ": "ou", "ൗ": "au", "ഃ": "a" };

  let result = text.replace(/[\u200B-\u200D\uFEFF]/g, ""); // Clean hidden characters

  // Translation Logic
  Object.keys(doubleConsonants).forEach(k => result = result.split(k).join(doubleConsonants[k] + "a"));
  Object.keys(consonants).forEach(k => result = result.split(k).join(consonants[k] + "a"));
  Object.keys(vowels).forEach(k => result = result.split(k).join(vowels[k]));
  Object.keys(modifiers).forEach(k => result = result.split(k).join(modifiers[k]));
  result = result.replace(/ം/g, "m");

  return result.trim();
};

/**
 * Converts Manglish (Roman) to Malayalam Script via Google API
 */
const manglishToMalayalam = async (query) => {
  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(query)}&itc=ml-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
    const { data } = await axios.get(url);
    if (data && data[0] === "SUCCESS") {
        return data[1][0][1][0];
    }
    return false;
  } catch (error) {
    console.error("Manglish Error:", error.message);
    return false;
  }
};

module.exports = { malayalamToManglish, manglishToMalayalam };
  
