const { Module } = require("../main");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { getTempPath, getTempSubdir } = require("../core/helpers");
const config = require("../config");
const { avMix, circle, rotate, trim } = require("./utils");
const acrcloud = require("acrcloud");

const BOT_BRAND = "ZAHID-KING-MD";

const acr = new acrcloud({
  host: "identify-eu-west-1.acrcloud.com",
  access_key: config.ACR_A,
  access_secret: config.ACR_S,
});

async function findMusic(file) {
  return new Promise((resolve, reject) => {
    acr.identify(file).then((result) => {
      var data = result.metadata?.music[0];
      resolve(data);
    });
  });
}

// 👑 Trim Audio/Video
Module(
  {
    pattern: "trim ?(.*)",
    desc: "Cut audio or video by start and end time",
    usage: ".trim 00:01,00:10",
    use: "edit",
  },
  async (message, match) => {
    if (!message.reply_message || (!message.reply_message.video && !message.reply_message.audio))
      return await message.sendReply("_Reply to an audio or video file!_");
    
    if (!match[1] || !match[1].includes(","))
      return await message.sendReply("_Provide start and end time. Example: .trim 00:01,00:10_");

    const parts = match[1].split(",");
    const start = parts[0]?.trim();
    const end = parts[1]?.trim();
    const savedFile = await message.reply_message.download();
    
    await message.send(`_Processing ${message.reply_message.audio ? 'Audio' : 'Video'} Trim..._`);
    
    const out = getTempPath(`trim_${Date.now()}.${message.reply_message.audio ? 'ogg' : 'mp4'}`);
    await trim(savedFile, start, end, out);
    
    if (message.reply_message.audio) {
      await message.sendReply({stream: fs.createReadStream(out)}, "audio");
    } else {
      await message.send({stream: fs.createReadStream(out)}, "video");
    }
  }
);

// 👑 Audio to Black Video
Module(
  {
    pattern: "black",
    desc: "Convert audio to black screen video",
    use: "edit",
  },
  async (message, match) => {
    if (!message.reply_message || !message.reply_message.audio)
      return await message.send("_Reply to an audio file!_");

    try {
      await message.sendReply("_Converting audio to black video..._");
      const audioFile = await message.reply_message.download();
      const outputPath = getTempPath(`black_${Date.now()}.mp4`);

      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(audioFile)
          .input("color=c=black:s=320x240:r=30")
          .inputFormat("lavfi")
          .outputOptions(["-shortest", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "51", "-c:a", "copy", "-pix_fmt", "yuv420p"])
          .format("mp4")
          .save(outputPath)
          .on("end", resolve)
          .on("error", reject);
      });

      await message.send(fs.readFileSync(outputPath), "video");
      if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (error) {
      await message.send("_Failed to process video._");
    }
  }
);

// 👑 Slow Motion Video
Module(
  {
    pattern: "slowmo",
    desc: "Create smooth slow motion video",
    use: "edit",
  },
  async (message, match) => {
    if (!message.reply_message || !message.reply_message.video)
      return await message.sendReply("_Reply to a video!_");
    
    var savedFile = await message.reply_message.download();
    await message.send("_Applying motion interpolation and rendering..._");
    
    const out = getTempPath("slowmo.mp4");
    ffmpeg(savedFile)
      .videoFilters("minterpolate=fps=120", "setpts=4*PTS")
      .noAudio()
      .format("mp4")
      .save(out)
      .on("end", async () => {
        await message.send(fs.readFileSync(out), "video");
      });
  }
);

// 👑 Find Music AI
Module(
  {
    pattern: "find ?(.*)",
    desc: "Identify music name using AI",
    use: "search",
  },
  async (message, match) => {
    if (!message.reply_message?.audio)
      return await message.sendReply("_Reply to a music/audio file!_");
    
    if (message.reply_message.duration > 60)
      return await message.send("_Audio is too long. Use .trim to cut it below 60 seconds._");
    
    await message.send("_Searching for music details..._");
    var audio = await message.reply_message.download("buffer");
    var data = await findMusic(audio);
    
    if (!data) return await message.sendReply("_No matching music found!_");
    
    let msg = `*───「 ${BOT_BRAND} 」───*\n\n`;
    msg += `*Title:* ${data.title}\n`;
    msg += `*Artist:* ${data.artists?.map((e) => e.name).join(", ")}\n`;
    msg += `*Album:* ${data.album?.name || "N/A"}\n`;
    msg += `*Released:* ${data.release_date || "N/A"}\n`;
    msg += `*YouTube:* ${data.external_metadata?.youtube ? "https://youtu.be/" + data.external_metadata.youtube.vid : "Not Available"}`;
    
    await message.sendReply(msg);
  }
);

// 👑 Rotate Video
Module(
  {
    pattern: "rotate ?(.*)",
    desc: "Rotate video (left/right/flip)",
    use: "edit",
  },
  async (message, match) => {
    if (!message.reply_message || !message.reply_message.video)
      return await message.sendReply("_Reply to a video! Usage: .rotate left|right|flip_");
    
    var file = await message.reply_message.download();
    var angle = "1"; // default right
    if (match[1] === "left") angle = "2";
    if (match[1] === "flip") angle = "3";
    
    await message.send("_Rotating video, please wait..._");
    const rotatedFile = await rotate(file, angle);
    await message.send(fs.readFileSync(rotatedFile), "video");
  }
);
