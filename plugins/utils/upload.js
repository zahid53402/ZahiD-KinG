/**
 * ZAHID-KING-MD - Media Upload Module
 * Handles file uploads to Catbox and ImgBB.
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const IMGBB_BASE_URL = "https://imgbb.com/";
const IMGBB_UPLOAD_URL = "https://imgbb.com/json";
const CATBOX_URL = "https://catbox.moe/user/api.php";

// Limits
const IMGBB_LIMIT = 32 * 1024 * 1024; // 32MB
const CATBOX_LIMIT = 200 * 1024 * 1024; // 200MB

/**
 * Upload to Catbox.moe (Best for MP4, MP3, and large files)
 */
const uploadToCatbox = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return { url: "_File not found._" };
    
    const fileStats = fs.statSync(filePath);
    if (fileStats.size > CATBOX_LIMIT) {
      return { url: "_File size exceeds 200MB limit._" };
    }

    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(filePath));

    const response = await axios.post(CATBOX_URL, form, {
      headers: form.getHeaders(),
    });

    return { url: response.data.trim() };
  } catch (error) {
    console.error("Catbox Upload Error:", error.message);
    return { url: "_Error uploading to Catbox._" };
  }
};

/**
 * Helper to fetch session token for ImgBB
 */
const fetchAuthToken = async () => {
  try {
    const response = await axios.get(IMGBB_BASE_URL);
    const authTokenMatch = response.data.match(/PF\.obj\.config\.auth_token="([a-f0-9]{40})"/);
    if (authTokenMatch) return authTokenMatch[1];
    throw new Error("Auth token not found.");
  } catch (error) {
    throw new Error("Failed to fetch ImgBB token.");
  }
};

/**
 * Upload to ImgBB (Best for JPG, PNG)
 */
const uploadToImgbb = async (imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) return { error: "File not found." };
    
    const fileStats = fs.statSync(imagePath);
    if (fileStats.size > IMGBB_LIMIT) return { url: "_Image too large (Max 32MB)._" };

    const authToken = await fetchAuthToken();
    const formData = new FormData();
    formData.append("source", fs.createReadStream(imagePath));
    formData.append("type", "file");
    formData.append("action", "upload");
    formData.append("auth_token", authToken);

    const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
      headers: formData.getHeaders(),
    });

    return response.data?.image || { error: "Upload failed." };
  } catch (error) {
    console.error("ImgBB Upload Error:", error.message);
    return { error: error.message };
  }
};

module.exports = { uploadToImgbb, uploadToCatbox };
