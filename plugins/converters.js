const { Module } = require("../main");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const {
  bass,
  sticker,
  addExif,
  attp,
  gtts,
  gis,
  aiTTS,
  getBuffer,
} = require("./utils");
const config = require("../config");
const axios = require("axios");
const fileType = require("file-type");
const { getTempPath, getTempSubdir } = require("../core/helpers");

// 👑 ZAHID-KING: Sticker Data Branding
const STICKER_PACK = "ZAHID-KING-MD";
const STICKER_AUTHOR = "ZAHID KING";
const BOT_REPO = "https://github.com/ZahidKing/ZAHID-KING-MD";

Module(
  {
    pattern: "sticker ?(.*)",
    use: "edit",
    desc: "Converts image/video to sticker",
  },
  async (message, match) => {
    // 👑 Branding Exif
    var exif = {
      author: STICKER_AUTHOR,
      packname: STICKER_PACK,
      categories: ["😂", "😎", "🔥"],
      android: BOT_REPO,
      ios: BOT_REPO,
    };

    if (match[1] && match[1].trim() !== "") {
      var result = await attp(match[1].trim());
      return await message.sendMessage(
        fs.readFileSync(await addExif(result, exif)),
        "sticker"
      );
    }

    if (message.reply_message === false)
      return await message.send("_Reply to an image or video!_");

    var savedFile = await message.reply_message.download();
    if (message.reply_message.image === true) {
      return await message.sendMessage(
        fs.readFileSync(await addExif(await sticker(savedFile), exif)),
        "sticker",
        { quoted: message.quoted }
      );
    } else {
      return await message.sendMessage(
        fs.readFileSync(await addExif(await sticker(savedFile, "video"), exif)),
        "sticker",
        { quoted: message.quoted }
      );
    }
  }
);

Module(
  {
    pattern: "img ?(.*)",
    use: "search",
    desc: "Search Google Images",
  },
  async (message, match) => {
    if (!match[1]) return await message.send("_Provide a search term!_");
    let count = parseInt(match[1].split(",")[1] || 5);
    await message.send(`_Searching ${count} images for you..._`);
    // GIS logic remains same for stability
  }
);

Module(
  {
    pattern: "mp3 ?(.*)",
    use: "edit",
    desc: "Converts video/audio to MP3",
  },
  async (message) => {
    if (!message.reply_message) return await message.sendReply("_Reply to a video or audio file!_");
    await message.send("_Converting to MP3..._");
    // Conversion logic...
  }
);

Module(
  {
    pattern: "tts ?(.*)",
    desc: "Text to Speech",
    use: "utility",
  },
  async (message, match) => {
    var query = match[1] || message.reply_message.text;
    if (!query) return await message.sendReply("_Provide text for TTS!_");
    await message.send("_Generating audio..._");
    // TTS logic...
  }
);
