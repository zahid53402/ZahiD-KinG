const axios = require("axios");
const FormData = require("form-data");

/**
 * ZAHID-KING-MD AI TTS Helper
 * Supported Voices: nova, alloy, ash, coral, echo, fable, onyx, sage, shimmer
 */

const VOICES = Object.freeze([
  "nova",
  "alloy",
  "ash",
  "coral",
  "echo",
  "fable",
  "onyx",
  "sage",
  "shimmer",
]);

// Function to validate voice selection
function getVoice(voice) {
  if (!voice) return "nova"; // Default voice for ZAHID-KING-MD
  const v = voice.toLowerCase();
  return VOICES.includes(v) ? v : "nova";
}

/**
 * Generates AI Voice from Text
 * @param {string} text - The text to convert
 * @param {string} voice - Voice name
 * @param {string} speed - Speech speed (0.50 to 2.00)
 */
async function aiTTS(text, voice = "nova", speed = "1.00") {
  if (!text) return { error: "No text provided for AI Voice" };

  const selectedVoice = getVoice(voice);
  const formData = new FormData();
  formData.append("msg", text);
  formData.append("lang", selectedVoice);
  formData.append("speed", speed);
  formData.append("source", "ttsmp3");

  try {
    const { data } = await axios.post(
      "https://ttsmp3.com/makemp3_ai.php",
      formData,
      { 
        headers: {
          ...formData.getHeaders(),
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        } 
      }
    );

    if (data?.Error === "Usage Limit exceeded") {
      return { error: "AI Voice limit reached. Try again later." };
    }

    if (data?.Error === 0 && data?.URL) {
      return { url: data.URL };
    }

    return { error: "Failed to generate AI Voice.", response: data };
  } catch (error) {
    return { error: "Network Error: " + error.message };
  }
}

module.exports = aiTTS;
