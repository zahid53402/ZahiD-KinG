const { getBuffer } = require("./misc");
const { getTotalUserCount } = require("../../core/store");
const config = require("../../config");
const os = require("os");

/**
 * ZAHID-KING-MD Alive Message Parser
 * Optimized for high performance and clean formatting
 */

async function parseAliveMessage(template, messageObject) {
  if (!template || !messageObject) return null;

  try {
    // System Stats
    const usedRam = bytesToSize(os.totalmem() - os.freemem());
    const totalRam = bytesToSize(os.totalmem());
    const totalUsers = await getTotalUserCount();
    
    // Bot Info from Config
    const infoParts = config.BOT_INFO.split(";");
    const botName = infoParts[0] || "ZAHID-KING-MD";
    const botOwner = infoParts[1] || "Zahid Khan";
    const botVersion = config.VERSION || "1.0.0";
    const mode = config.MODE || "Public";
    const serverOS = os.platform() === "linux" ? "Linux (Cloud)" : os.platform();
    const uptime = formatUptime(process.uptime());

    // User Info
    let senderName = "";
    let senderNumber = "";
    if (messageObject.sender) {
      senderNumber = messageObject.sender.split("@")[0];
      try {
        const contact = await messageObject.client.getContact(messageObject.sender);
        senderName = contact.name || contact.notify || senderNumber;
      } catch {
        senderName = messageObject.senderName || senderNumber;
      }
    }

    // Replace Placeholders in template
    let parsedMessage = template
      .replace(/\$botname/g, botName)
      .replace(/\$owner/g, botOwner)
      .replace(/\$version/g, botVersion)
      .replace(/\$mode/g, mode)
      .replace(/\$server/g, serverOS)
      .replace(/\$ram/g, usedRam)
      .replace(/\$totalram/g, totalRam)
      .replace(/\$users/g, totalUsers.toString())
      .replace(/\$uptime/g, uptime)
      .replace(/\$user/g, senderName)
      .replace(/\$number/g, senderNumber)
      .replace(/\$date/g, new Date().toLocaleDateString())
      .replace(/\$time/g, new Date().toLocaleTimeString());

    let mediaBuffer = null;
    let isVideo = false;

    // Handle $pp placeholder (Sender Profile Picture)
    if (template.includes("$pp") && messageObject.sender) {
      try {
        const ppUrl = await messageObject.client.profilePictureUrl(messageObject.sender, "image");
        if (ppUrl) mediaBuffer = await getBuffer(ppUrl);
      } catch (e) {
        console.log("PP Fetch Error:", e.message);
      }
      parsedMessage = parsedMessage.replace(/\$pp/g, "").trim();
    }

    // Handle $media:URL placeholder (Custom Image/Video)
    const mediaRegex = /\$media:(https?:\/\/[^\s]+)/g;
    const mediaMatch = mediaRegex.exec(template);
    if (mediaMatch) {
      const mediaUrl = mediaMatch[1];
      try {
        mediaBuffer = await getBuffer(mediaUrl);
        isVideo = /\.(mp4|mov|avi|mkv|webm|gif)$/i.test(mediaUrl);
      } catch (e) {
        console.log("Media Fetch Error:", e.message);
      }
      parsedMessage = parsedMessage.replace(mediaRegex, "").trim();
    }

    return {
      text: parsedMessage,
      media: mediaBuffer,
      isVideo: isVideo,
      mentions: messageObject.sender ? [messageObject.sender] : [],
    };
  } catch (error) {
    console.error("Alive Parsing Error:", error);
    return null;
  }
}

async function sendAliveMessage(messageObject, parsedMessage) {
  if (!parsedMessage) return;

  try {
    const commonOptions = {
      caption: parsedMessage.text || "",
      mentions: parsedMessage.mentions
    };

    if (parsedMessage.media) {
      if (parsedMessage.isVideo) {
        return await messageObject.client.sendMessage(messageObject.jid, {
          video: parsedMessage.media,
          gifPlayback: true,
          ...commonOptions
        });
      } else {
        return await messageObject.client.sendMessage(messageObject.jid, {
          image: parsedMessage.media,
          ...commonOptions
        });
      }
    }

    // Text-only fallback
    await messageObject.client.sendMessage(messageObject.jid, {
      text: parsedMessage.text,
      mentions: parsedMessage.mentions
    });

  } catch (error) {
    console.error("Alive Sending Error:", error);
    await messageObject.sendReply(parsedMessage.text);
  }
}

// Utility: Format RAM size
function bytesToSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
}

// Utility: Format Uptime
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

module.exports = { parseAliveMessage, sendAliveMessage };
