const { Module } = require("../main");
const {
  pinterestSearch,
  downloadGram,
  pinterestDl,
  tiktok,
  igStalk,
  fb,
} = require("./utils");
const botConfig = require("../config");
const axios = require("axios");
const isFromMe = botConfig.MODE === "public" ? false : true;

const BOT_BRAND = "ZAHID-KING-MD";

async function checkRedirect(url) {
  let split_url = url.split("/");
  if (split_url.includes("share")) {
    let res = await axios.get(url);
    return res.request.res.responseUrl;
  }
  return url;
}

// 👑 Instagram Downloader
Module(
  {
    pattern: "insta ?(.*)",
    fromMe: isFromMe,
    desc: "Download Instagram Reels/Posts/TV",
    use: "download",
  },
  async (message, match) => {
    let mediaLinks = match[1] || message.reply_message?.text;
    if (!mediaLinks) return await message.sendReply("_Provide Instagram link(s)_");

    const allUrls = mediaLinks.match(/\bhttps?:\/\/\S+/gi) || [];
    if (!allUrls.length) return await message.sendReply("_Invalid Instagram link!_");

    await message.send(`_Fetching media for ${BOT_BRAND}..._`);

    try {
      const allMediaUrls = [];
      for (let url of allUrls) {
        url = await checkRedirect(url);
        if (url.includes("instagram.com")) {
          const downloadResult = await downloadGram(url);
          if (downloadResult) allMediaUrls.push(...downloadResult);
        }
      }

      if (!allMediaUrls.length) return await message.sendReply("_Media not found or account is private!_");

      if (allMediaUrls.length === 1) {
        return await message.sendMessage(
          { url: allMediaUrls[0] },
          /\.(jpg|jpeg|png|webp)(\?|$)/i.test(allMediaUrls[0]) ? "image" : "video",
          { quoted: message.data }
        );
      }

      const album = allMediaUrls.map((url) => (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) ? { image: url } : { video: url }));
      album[0].caption = `*Downloaded by ${BOT_BRAND}*`;
      return await message.client.albumMessage(message.jid, album, message.data);
    } catch (err) {
      return await message.sendReply("_Error downloading media. Try again later._");
    }
  }
);

// 👑 Facebook Downloader
Module(
  {
    pattern: "fb ?(.*)",
    fromMe: isFromMe,
    desc: "Download Facebook videos",
    use: "download",
  },
  async (message, match) => {
    let videoLink = match[1] || message.reply_message?.text;
    if (!videoLink) return await message.sendReply("_Provide Facebook video link!_");
    
    videoLink = videoLink.match(/\bhttps?:\/\/\S+/gi)?.[0];
    if (!videoLink) return await message.sendReply("_Invalid link!_");

    try {
      await message.send("_Downloading Facebook video..._");
      const { url } = await fb(videoLink);
      return await message.sendMessage({ url }, "video", { caption: `*Downloaded by ${BOT_BRAND}*` });
    } catch (e) {
      return await message.sendReply("_Failed to download. Make sure the video is public._");
    }
  }
);

// 👑 Instagram Stalk (Profile Info)
Module(
  {
    pattern: "ig ?(.*)",
    fromMe: isFromMe,
    desc: "Get Instagram account details",
    use: "search",
  },
  async (message, match) => {
    if (!match[1]) return await message.sendReply("_Provide a username!_");
    let user = match[1].replace(/@/g, "");

    try {
      const account = await igStalk(encodeURIComponent(user));
      let caption = `*───「 ${BOT_BRAND} IG STALK 」───*\n\n`;
      caption += `*Name:* ${account.full_name}\n`;
      caption += `*Followers:* ${account.followers}\n`;
      caption += `*Following:* ${account.following}\n`;
      caption += `*Posts:* ${account.posts}\n`;
      caption += `*Bio:* ${account.bio}\n`;
      caption += `*Private:* ${account.is_private ? "Yes" : "No"}`;

      return await message.sendMessage({ url: account.profile_pic }, "image", { caption });
    } catch {
      return await message.sendReply("_User not found or server busy!_");
    }
  }
);

// 👑 TikTok Downloader
Module(
  {
    pattern: "tiktok ?(.*)",
    fromMe: isFromMe,
    desc: "Download TikTok videos",
    use: "download",
  },
  async (message, match) => {
    let link = match[1] || message.reply_message?.text;
    if (!link) return await message.sendReply("_Provide TikTok link!_");
    
    link = link.match(/\bhttps?:\/\/\S+/gi)?.[0];
    try {
      await message.send("_Downloading TikTok..._");
      const video = await tiktok(link);
      return await message.sendReply(video, "video");
    } catch {
      return await message.sendReply("_Error downloading TikTok video._");
    }
  }
);

// 👑 Pinterest Search/Download
Module(
  {
    pattern: "pinterest ?(.*)",
    fromMe: isFromMe,
    desc: "Download from Pinterest",
    use: "download",
  },
  async (message, match) => {
    let query = match[1] || message.reply_message?.text;
    if (!query) return await message.sendReply("_Provide search term or Pin link!_");

    if (query.includes("pinterest.com") || query.includes("pin.it")) {
      try {
        const res = await pinterestDl(query.match(/\bhttps?:\/\/\S+/gi)[0]);
        return await message.sendMessage({ url: res.result }, "video", { caption: `*Generated by ${BOT_BRAND}*` });
      } catch {
        return await message.sendReply("_Failed to download Pinterest video._");
      }
    } else {
      try {
        let count = parseInt(query.split(",")[1]) || 5;
        let q = query.split(",")[0];
        const res = await pinterestSearch(q, count);
        const album = res.result.slice(0, count).map(url => ({ image: url }));
        album[0].caption = `*Pinterest Results for:* ${q}\n*By ${BOT_BRAND}*`;
        return await message.client.albumMessage(message.jid, album, message.data);
      } catch {
        return await message.sendReply("_No results found!_");
      }
    }
  }
);
