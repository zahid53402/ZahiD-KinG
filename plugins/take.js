const {
  addExif,
  webp2mp4,
  addID3,
  getBuffer,
  uploadToImgbb,
  uploadToCatbox,
} = require("./utils");
const { Module } = require("../main");
let config = require("../config");
let fs = require("fs");

const BOT_BRAND = "ZAHID-KING-MD";

Module(
  {
    pattern: "take ?(.*)",
    use: "edit",
    desc: "Changes sticker pack name or audio metadata.",
  },
  async (m, match) => {
    if (!m.reply_message)
      return await m.sendMessage("_Reply to an audio or a sticker_");
    
    var audiomsg = m.reply_message.audio;
    var stickermsg = m.reply_message.sticker;
    var q = await m.reply_message.download();

    // 👑 Handle Sticker Ownership
    if (stickermsg) {
      let packname, author;
      if (match[1] !== "") {
        packname = match[1].includes(";") ? match[1].split(";")[0] : match[1];
        author = match[1].includes(";") ? match[1].split(";")[1] : BOT_BRAND;
      } else {
        packname = config.STICKER_DATA.split(";")[0] || BOT_BRAND;
        author = config.STICKER_DATA.split(";")[1] || "Official Bot";
      }

      var exif = {
        author: author,
        packname: packname,
        categories: ["😂", "😎"],
        android: "https://zahid-king.com", // Updated to generic or your site
        ios: "https://zahid-king.com",
      };

      return await m.client.sendMessage(
        m.jid,
        { sticker: fs.readFileSync(await addExif(q, exif)) },
        { quoted: m.quoted }
      );
    }

    // 👑 Handle Audio Metadata (Title/Artist)
    if (audiomsg) {
      let info = match[1] || config.AUDIO_DATA;
      if (info === "default") {
        info = `${BOT_BRAND} Audio;ZAHID-KING;https://i.imgur.com/8QnUq9Y.jpeg`;
      }

      let spl = info.split(";");
      let title = spl[0] || "Zahid-King-Audio";
      let artist = spl[1] || BOT_BRAND;
      let imageUrl = spl[2] || "https://i.imgur.com/8QnUq9Y.jpeg";

      let image = await getBuffer(imageUrl);
      let res = await addID3(q, title, artist, BOT_BRAND, image);

      return await m.client.sendMessage(
        m.jid,
        { audio: res, mimetype: "audio/mp4", ptt: false },
        { quoted: m.quoted }
      );
    }

    if (!audiomsg && !stickermsg)
      return await m.sendReply("_Reply to an audio or a sticker!_");
  }
);

// 👑 Command: Convert Animated Sticker to MP4
Module(
  {
    pattern: "mp4 ?(.*)",
    use: "edit",
    desc: "Converts animated sticker to video",
  },
  async (m) => {
    if (!m.reply_message.sticker) return await m.sendReply("_Reply to an animated sticker!_");
    
    await m.send("_Converting to MP4..._");
    var q = await m.reply_message.download();
    try {
      let path = __dirname + "/temp/output.mp4";
      await webp2mp4(q, path);
      await m.client.sendMessage(m.jid, { video: { url: path }, caption: `*Converted by ${BOT_BRAND}*` }, { quoted: m.quoted });
    } catch (e) {
      return await m.sendReply("_Failed to convert sticker._");
    }
  }
);

// 👑 Command: Get Media URL (ImgBB/Catbox)
Module(
  {
    pattern: "url ?(.*)",
    desc: "Uploads media and returns a direct link",
    use: "edit",
  },
  async (m) => {
    if (!m.reply_message) return await m.sendReply("_Reply to any image, video, or audio!_");
    
    await m.send("_Uploading to cloud..._");
    let q = await m.reply_message.download();
    let result;

    if (m.reply_message.image || m.reply_message.sticker) {
      result = await uploadToImgbb(q);
    } else {
      result = await uploadToCatbox(q);
    }

    return await m.sendReply(`*───「 URL GENERATED 」───*\n\n*Link:* ${result.url || result}\n\n*By ${BOT_BRAND}*`);
  }
);
