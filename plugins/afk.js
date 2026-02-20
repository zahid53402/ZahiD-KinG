const { Module } = require("../main");
const { isAdmin } = require("./utils");
const { ADMIN_ACCESS } = require("../config");
const config = require("../config");
const { setVar, getVar, delVar } = require("./manage");

const afkCache = new Map();

async function initAFKCache() {
  try {
    const afkData = config.AFK_DATA || "{}";
    const afkUsers = JSON.parse(afkData);
    for (const [userJid, userData] of Object.entries(afkUsers)) {
      afkCache.set(userJid, {
        reason: userData.reason,
        setAt: new Date(userData.setAt),
        lastSeen: new Date(userData.lastSeen),
        messageCount: userData.messageCount || 0,
      });
    }
  } catch (error) {
    if (!config.AFK_DATA) await setVar("AFK_DATA", "{}");
  }
}

initAFKCache();

// ٹائم فارمیٹنگ کا فنکشن (پہلے جیسا ہی ہے)
function timeSince(date) {
  if (!date) return "Never";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " year" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " month" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " day" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hour" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minute" + (Math.floor(interval) > 1 ? "s" : "") + " ago";
  return Math.floor(seconds) + " second" + (Math.floor(seconds) > 1 ? "s" : "") + " ago";
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

async function saveAFKData() {
  const afkData = {};
  for (const [userJid, userData] of afkCache.entries()) {
    afkData[userJid] = {
      reason: userData.reason,
      setAt: userData.setAt.toISOString(),
      lastSeen: userData.lastSeen.toISOString(),
      messageCount: userData.messageCount,
    };
  }
  await setVar("AFK_DATA", JSON.stringify(afkData));
}

async function setAFK(userJid, reason = "I am currently away from keyboard") {
  const now = new Date();
  afkCache.set(userJid, { reason, setAt: now, lastSeen: now, messageCount: 0 });
  await saveAFKData();
}

async function removeAFK(userJid) {
  const afkData = afkCache.get(userJid);
  afkCache.delete(userJid);
  await saveAFKData();
  return afkData;
}

async function updateLastSeen(userJid) {
  const afkData = afkCache.get(userJid);
  if (afkData) { afkData.lastSeen = new Date(); await saveAFKData(); }
}

async function incrementMessageCount(userJid) {
  const afkData = afkCache.get(userJid);
  if (afkData) { afkData.messageCount++; await saveAFKData(); }
}

const isAFK = (userJid) => afkCache.has(userJid);
const getAFKData = (userJid) => afkCache.get(userJid);

Module(
  {
    pattern: "afk ?(.*)",
    fromMe: true,
    desc: "Set yourself as Away From Keyboard",
  },
  async (message, match) => {
    const userJid = message.sender;
    const input = match[1]?.trim();

    if (input?.toLowerCase() === "list") {
      if (afkCache.size === 0) return await message.sendReply("_No users are currently AFK._");
      let afkList = `*👑 ZAHID-KING AFK LIST*\n\n`;
      let count = 1;
      for (const [jid, data] of afkCache.entries()) {
        afkList += `${count}. @${jid.split("@")[0]}\n📝 _Reason:_ ${data.reason}\n⏰ _Time:_ ${formatDuration(Date.now() - new Date(data.setAt).getTime())}\n\n`;
        count++;
      }
      return await message.sendMessage(afkList, "text", { mentions: Array.from(afkCache.keys()) });
    }

    const reason = input || "I am currently away from keyboard";
    await setAFK(userJid, reason);
    return await message.sendReply(`*👑 ZAHID-KING-MD: AFK SET*\n\n📝 _Reason:_ \`${reason}\`\n\n_I will notify everyone who mentions you._`);
  }
);

// Auto Reply Handler
Module({ on: "message", fromMe: false }, async (message) => {
  const senderJid = message.sender;
  
  // Welcome Back Logic
  if (message.fromMe && isAFK(senderJid)) {
     const afkData = await removeAFK(senderJid);
     if (afkData) {
       const timeAFK = formatDuration(Date.now() - new Date(afkData.setAt).getTime());
       await message.sendReply(`*👑 ZAHID-KING: WELCOME BACK!*\n\n⏰ _You were away for:_ \`${timeAFK}\`\n💬 _Messages received:_ \`${afkData.messageCount}\``);
     }
     return;
  }

  // Mention Handler
  if (message.isGroup && message.mention && message.mention.length > 0) {
    for (const mentionedJid of message.mention) {
      if (isAFK(mentionedJid)) {
        const data = getAFKData(mentionedJid);
        await incrementMessageCount(mentionedJid);
        const reply = `*👑 ZAHID-KING-MD: USER IS AFK*\n\n👤 @${mentionedJid.split("@")[0]} is busy.\n📝 _Reason:_ \`${data.reason}\`\n⏰ _Since:_ \`${formatDuration(Date.now() - new Date(data.setAt).getTime())}\``;
        await message.sendMessage(reply, "text", { mentions: [mentionedJid], quoted: message.data });
      }
    }
  }
});

module.exports = { setAFK, removeAFK, isAFK, getAFKData, updateLastSeen, incrementMessageCount, saveAFKData };
          
