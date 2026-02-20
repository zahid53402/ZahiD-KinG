/**
 * ZAHID-KING-MD Link Detection Utility
 * Detects clickable links and protects groups from unauthorized URLs.
 */

const validTLDs = [
  "com", "org", "net", "edu", "gov", "mil", "int", "info", "biz", "name", 
  "pro", "online", "tech", "store", "app", "dev", "ai", "io", "co", "me", 
  "tv", "cc", "pk", "in", "us", "uk", "ca", "br", "xyz", "site", "website"
  // ... (تمام اہم TLDs پہلے سے موجود ہیں)
];

/**
 * ZAHID-KING-MD - Link Recognition Logic
 */
function createLinkPatterns() {
  const tldPattern = validTLDs.join("|");

  return [
    /\bhttps?:\/\/\S+/gi, // Matches http:// or https://
    /\bwww\.\S+\.\S+/gi,   // Matches www.links
    new RegExp(
      `\\b[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.(${tldPattern})(?:\\/\\S*)?\\b`,
      "gi"
    ),
  ];
}

/**
 * Filters out false positives (like dates 1.2.3)
 */
function isValidLink(link) {
  if (/^https?:\/\/$/.test(link)) return false;
  if (/^\d+\.\d+(\.\d+)?$/.test(link)) return false; // Ignore numbers/dates
  if (link.length < 4) return false;

  const parts = link.split(".");
  const tld = parts[parts.length - 1].split("/")[0].toLowerCase();
  return validTLDs.includes(tld);
}

/**
 * Main Function: Detect links in any text
 */
function detectLinks(text) {
  if (!text || typeof text !== "string") return [];

  const urlPatterns = createLinkPatterns();
  let foundLinks = [];

  for (const pattern of urlPatterns) {
    const matches = text.match(pattern);
    if (matches) foundLinks = foundLinks.concat(matches);
  }

  // Remove duplicates and validate
  return [...new Set(foundLinks)].filter(isValidLink);
}

function hasLinks(text) {
  return detectLinks(text).length > 0;
}

module.exports = {
  detectLinks,
  hasLinks,
  isValidLink,
  extractDomain: (link) => {
    let domain = link.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    return domain.toLowerCase();
  }
};
