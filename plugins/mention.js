const { Module } = require("../main");
const { HANDLERS } = require("../config");
const config = require("../config");
const { uploadToCatbox } = require("./utils/upload");
const fs = require("fs");
const { setVar, delVar } = require("./manage");

const BOT_BRAND = "ZAHID-KING-MD";
var handler = HANDLERS !== "false" ? HANDLERS.split("")[0] : ".";

// Helper to get mention data
function getMentionReply() {
  try {
    return config.MENTION_REPLY ? JSON.parse(config.MENTION_REPLY) : null;
  } catch (error) {
    return null;
  }
}

// Check if JID is a Sudo user
function isSudoUser(jid) {
  if (!jid) return false;
  let sudoMap = [];
  if (config.SUDO_MAP) {
    try {
      sudoMap = JSON.parse(config.SUDO_MAP);
    } catch (e) {
      sudoMap = [];
    }
  }
  return sudoMap.includes(jid);
}

Module(
  {
    pattern: "mention ?(.*)",
    fromMe: true,
    desc: "Manage auto mention reply",
    usage: ".mention set (reply to msg) | .mention get | .mention del",
  },
  async (message, match) => {
    const args = match[1]?.trim().split(" ");
    const subcommand = args?.[0]?.toLowerCase();
    const input = args?.slice(1).join(" ");

    if (!subcommand) {
      return await message.sendReply(
        `*───「 ${BOT_BRAND} 」───*\n\n` +
        `*Available Commands:*\n` +
        `• \`${handler}mention set\` - Set reply (Reply to a message)\n` +
        `• \`${handler}mention get\` - See current reply\n` +
        `• \`${handler}mention del\` - Delete reply\n` +
        `• \`${handler}mention help\` - Detailed guide`
      );
    }

    switch (subcommand) {
      case "del":
        await delVar("MENTION_REPLY");
        return await message.sendReply("_Mention reply deleted successfully!_");

      case "get":
        const mentionData = getMentionReply();
        if (!mentionData) return await message.sendReply("_No mention reply is set!_");
        
        return await message.sendReply(
          `*───「 MENTION INFO 」───*\n\n` +
          `*Type:* ${mentionData.type.toUpperCase()}\n` +
          `*Content:* ${mentionData.content || mentionData.caption || "Media File"}\n` +
          `*Timestamp:* ${new Date(mentionData.timestamp).toLocaleString()}`
        );

      case "set":
        let data = { type: "text", content: "", caption: "", url: "", timestamp: new Date().toISOString() };
        
        if (message.reply_message) {
          const reply = message.reply_message;
          if (reply.image || reply.video || reply.audio || reply.sticker) {
            await message.send("_Uploading media, please wait..._");
            const path = await reply.download();
            const result = await uploadToCatbox(path);
            fs.unlinkSync(path);
            
            data.type = reply.image ? "image" : reply.video ? "video" : reply.audio ? "audio" : "sticker";
            data.url = result.url;
            data.caption = reply.text || "";
          } else {
            data.content = reply.text;
          }
        } else if (input) {
          data.content = input;
        } else {
          return await message.sendReply("_Reply to a message or provide text!_");
        }

        await setVar("MENTION_REPLY", JSON.stringify(data));
        return await message.sendReply("_✅ Mention reply set successfully!_");

      case "help":
        return await message.sendReply(
          `*───「 MENTION HELP 」───*\n\n` +
          `This feature replies automatically when someone tags you or the bot.\n\n` +
          `*Example:* Reply to a photo and type \`.mention set\`. Now whenever someone tags you, the bot will send that photo.`
        );

      default:
        return await message.sendReply("_Unknown command. Use .mention help_");
    }
  }
);

// Listener for mentions
Module({ on: "text", fromMe: false }, async (message) => {
  if (!message.mention || message.mention.length === 0) return;

  const botId = message.client.user?.lid?.split(":")[0] + "@s.whatsapp.net";
  const isBotMentioned = message.mention.some(jid => jid.split("@")[0] === botId.split("@")[0] || isSudoUser(jid));

  if (isBotMentioned) {
    const data = getMentionReply();
    if (!data) return;

    if (data.type === "text") return await message.sendReply(data.content);
    if (data.type === "image") return await message.sendReply({ url: data.url }, "image", { caption: data.caption });
    if (data.type === "video") return await message.sendReply({ url: data.url }, "video", { caption: data.caption });
    if (data.type === "audio") return await message.sendReply({ url: data.url }, "audio", { ptt: true });
    if (data.type === "sticker") return await message.sendReply({ url: data.url }, "sticker");
  }
});
                                                
