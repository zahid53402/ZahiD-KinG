const { Module } = require("../main");
const fs = require("fs");
const path = require("path");
const {
  downloadVideo,
  downloadAudio,
  searchYoutube,
  getVideoInfo,
  convertM4aToMp3,
} = require("./utils/yt");

const config = require("../config");
const BOT_BRAND = "ZAHID-KING-MD";
const VIDEO_SIZE_LIMIT = 150 * 1024 * 1024; // 150MB Limit

// 🕒 Helper: Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// 📺 Command: YouTube Search & Audio List
Module(
  {
    pattern: "song ?(.*)",
    fromMe: false,
    desc: "Search and download audio from YouTube",
    use: "download",
  },
  async (message, match) => {
    const query = match[1];
    if (!query) return await message.sendReply(`_Please provide a song name!_\n_Example: .song Faded_`);

    try {
      const searchMsg = await message.sendReply(`_Searching ${BOT_BRAND} Database..._`);
      const results = await searchYoutube(query, 10);

      if (!results || results.length === 0) return await message.edit("_No results found!_", message.jid, searchMsg.key);

      let resultText = `*───「 ${BOT_BRAND} YOUTUBE 」───*\n\n`;
      results.forEach((video, index) => {
        resultText += `*${index + 1}.* ${video.title}\n`;
        resultText += `   _Time:_ \`${video.duration}\` | _Views:_ \`${video.views}\`\n\n`;
      });

      resultText += `_Reply with a number (1-10) to download audio._`;
      await message.edit(resultText, message.jid, searchMsg.key);
    } catch (e) {
      await message.sendReply("_Search failed!_");
    }
  }
);

// 🎬 Command: Video Downloader (Direct 360p)
Module(
  {
    pattern: "video ?(.*)",
    fromMe: false,
    desc: "Download YouTube video (360p)",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;
    if (!url || !url.includes("youtu")) return await message.sendReply("_Please provide a valid YouTube link!_");

    let downloadMsg;
    try {
      downloadMsg = await message.sendReply(`_Downloading Video for ${BOT_BRAND}..._`);
      const result = await downloadVideo(url, "360p");
      
      await message.edit("_Uploading..._", message.jid, downloadMsg.key);
      const stream = fs.createReadStream(result.path);
      
      await message.sendMessage({ stream }, "video", {
        caption: `*Title:* ${result.title}\n*Brand:* ${BOT_BRAND}`,
      });

      if (fs.existsSync(result.path)) fs.unlinkSync(result.path);
      await message.edit("_Done! ✅_", message.jid, downloadMsg.key);
    } catch (e) {
      await message.sendReply("_Download failed!_");
    }
  }
);

// 🎵 Command: Play Music (Instant)
Module(
  {
    pattern: "play ?(.*)",
    fromMe: false,
    desc: "Directly play audio from YouTube",
    use: "download",
  },
  async (message, match) => {
    let input = match[1];
    if (!input) return await message.sendReply("_Enter song name!_");

    let downloadMsg = await message.sendReply(`_Playing ${input} via ${BOT_BRAND}..._`);
    try {
      const results = await searchYoutube(input, 1);
      if (!results.length) return await message.edit("_Not found!_", message.jid, downloadMsg.key);

      const result = await downloadAudio(results[0].url);
      const mp3Path = await convertM4aToMp3(result.path);

      await message.sendReply({ stream: fs.createReadStream(mp3Path) }, "audio", { mimetype: "audio/mp4" });
      
      if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
      await message.edit(`_Enjoy your music! 🎧_`, message.jid, downloadMsg.key);
    } catch (e) {
      await message.edit("_Playback failed!_", message.jid, downloadMsg.key);
    }
  }
);

// 🎥 Command: Detailed Info (YTV)
Module(
  {
    pattern: "ytv ?(.*)",
    fromMe: false,
    desc: "Get video details and quality options",
    use: "download",
  },
  async (message, match) => {
    let url = match[1] || message.reply_message?.text;
    if (!url || !url.includes("youtu")) return await message.sendReply("_Provide a YouTube link!_");

    try {
      const infoMsg = await message.sendReply("_Fetching Metadata..._");
      const info = await getVideoInfo(url);
      
      let text = `*───「 ${BOT_BRAND} INFO 」───*\n\n`;
      text += `*Title:* ${info.title}\n`;
      text += `*ID:* ${info.videoId}\n\n`;
      text += `_Use .video <link> to download quickly in 360p._`;
      
      await message.edit(text, message.jid, infoMsg.key);
    } catch (e) {
      await message.sendReply("_Error fetching info!_");
    }
  }
);
