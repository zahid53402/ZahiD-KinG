/**
 * ZAHID-KING-MD - Main Export Index
 * This file connects all utility functions and modules.
 */

// 1. Database Operations (Safety & Group Management)
const dbOperations = require("./db/functions");
const {
  getWarn, setWarn, resetWarn, decrementWarn, getWarnCount, getAllWarns,
  antilinkConfig, antiword, antifake, antipromote, antidemote,
  antispam, antibot, pdm, welcome, goodbye, filter,
} = dbOperations;

// 2. Media Processing (Image & Video Tools)
const mediaProcessing = require("./mediaProcessors");
const {
  addExif, bass, circle, blur, attp, sticker, rotate, avMix, webp2mp4, addID3, trim,
} = mediaProcessing;

// 3. General Utilities (Social Media & Tools)
const utils = require("./misc");
const {
  parseUptime, isNumeric, isAdmin, mentionjid, getJson, bytesToSize,
  isFake, processOnwa, findMusic, searchYT, downloadGram, pinterestDl,
  fb, igStalk, tiktok, story, getThumb, gtts, getBuffer, lyrics, pinterestSearch,
} = utils;

// 4. External Plugins & AI Modules
const language = require("./manglish");
const aiTTS = require("./ai-tts");
const { gis } = require("./gis");
const { uploadToImgbb, uploadToCatbox } = require("./upload");
const linkDetector = require("./link-detector");
const fancy = require("./fancy");

// 5. Export Everything for the Bot Engine
module.exports = {
  // Group & Warning System
  getWarn, setWarn, resetWarn, decrementWarn, getWarnCount, getAllWarns,
  antilinkConfig, antiword, antifake, antipromote, antidemote,
  antispam, antibot, pdm, welcome, goodbye, filter,

  // Media & Sticker Tools
  addExif, bass, circle, blur, attp, sticker, rotate, avMix, webp2mp4, addID3, trim,

  // Social & Search Utilities
  parseUptime, isNumeric, isAdmin, mentionjid, getJson, bytesToSize,
  isFake, aiTTS, processOnwa, findMusic, searchYT, downloadGram, 
  pinterestDl, fb, igStalk, tiktok, story, getThumb, gtts, getBuffer, 
  pinterestSearch, lyrics,

  // Specialized Modules
  malayalamToManglish: language.malayalamToManglish,
  manglishToMalayalam: language.manglishToMalayalam,
  gis,
  fancy,
  uploadToImgbb,
  uploadToCatbox,
  linkDetector,
};
