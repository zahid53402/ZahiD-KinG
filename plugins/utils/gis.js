/**
 * ZAHID-KING-MD Image Search Engine
 * Powered by Google & Pinterest Scraper
 */

const REGEX = /\["(\bhttps?:\/\/[^"]+)",(\d+),(\d+)\],null/g;

/**
 * Google Image Search (GIS)
 * @param {String} searchTerm - What to search
 * @param {Number} limit - How many images
 */
async function gis(searchTerm, limit, options = {}) {
  if (!searchTerm || typeof searchTerm !== "string") return [];

  const {
    query = {},
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  } = options;

  try {
    const url = `https://www.google.com/search?${new URLSearchParams({
      ...query,
      udm: "2",
      tbm: "isch",
      q: searchTerm,
    })}`;

    const response = await fetch(url, { headers: { "User-Agent": userAgent } });
    const content = await response.text();

    let result;
    let urls = [];
    let i = 0;

    while ((result = REGEX.exec(content))) {
      if (i == limit) break;
      // Clean and push the image URL
      urls.push(result[1]);
      i++;
    }
    return urls;
  } catch (error) {
    console.error("GIS Search Error:", error.message);
    return [];
  }
}

/**
 * Pinterest Image Search
 * Specifically filters for high-quality Pinterest pins
 */
async function pinterestSearch(searchTerm, limit, options = {}) {
  const queryTerm = "pinterest " + searchTerm;
  const {
    query = {},
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  } = options;

  try {
    const url = `https://www.google.com/search?${new URLSearchParams({
      ...query,
      udm: "2",
      tbm: "isch",
      q: queryTerm,
    })}`;

    const response = await fetch(url, { headers: { "User-Agent": userAgent } });
    const content = await response.text();

    let result;
    let urls = [];
    let i = 0;

    while ((result = REGEX.exec(content))) {
      // Only pick images from Pinterest domain
      if (result[1].includes("pinimg.com")) {
        if (i == limit) break;
        urls.push(result[1]);
        i++;
      }
    }
    return urls;
  } catch (error) {
    console.error("Pinterest Search Error:", error.message);
    return [];
  }
}

module.exports = { gis, pinterestSearch };
