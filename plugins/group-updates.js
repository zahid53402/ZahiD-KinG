const {
  isAdmin,
  isFake,
  antifake,
  pdm,
  antipromote,
  antidemote,
  welcome,
  goodbye,
} = require("./utils");
const { automute, autounmute, stickcmd } = require("./utils/db/schedulers");
const {
  parseWelcomeMessage,
  sendWelcomeMessage,
} = require("./utils/welcome-parser");

async function isSuperAdmin(message, user = message.client.user.id) {
  var metadata = await message.client.groupMetadata(message.jid);
  let superadmin = metadata.participants.filter((v) => v.admin == "superadmin");
  superadmin = superadmin.length ? superadmin[0].id == user : false;
  return superadmin;
}
const { Module } = require("../main");
const { ALLOWED, HANDLERS, ADMIN_ACCESS, SUDO } = require("../config");
var handler = HANDLERS !== "false" ? HANDLERS.split("")[0] : ".";

// Time converter for Auto-Mute
function tConvert(time) {
  time = time.toString().match(/^([01]\d|2[0-3])( )([0-5]\d)(:[0-5]\d)?$/) || [time];
  if (time.length > 1) {
    time = time.slice(1);
    time[5] = +time[0] < 12 ? " AM" : " PM";
    time[0] = +time[0] % 12 || 12;
  }
  return time.join("").replace(" ", ":");
}

async function extractData(message) {
  return message.quoted.message.stickerMessage.fileSha256.toString();
}

// 👑 Sticker Commands
Module(
  {
    pattern: "stickcmd ?(.*)",
    fromMe: true,
    desc: "Assign a command to a sticker",
    use: "utility",
  },
  async (message, match) => {
    if (!match[1] || !message.reply_message?.sticker)
      return await message.sendReply("_Reply to a sticker! Example: .stickcmd kick_");
    try {
      await stickcmd.set(match[1], await extractData(message));
      await message.send(`_Command *${match[1]}* assigned to this sticker!_`);
    } catch {
      return await message.sendReply("_Operation failed!_");
    }
  }
);

// 👑 Auto-Mute System
Module(
  {
    pattern: "automute ?(.*)",
    fromMe: false,
    desc: "Set auto-mute time (24h format)",
    use: "group",
  },
  async (message, match) => {
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (message.fromOwner || adminAccess) {
      match = match[1]?.toLowerCase();
      if (!match) return await message.sendReply("_Example: .automute 22 00 (for 10 PM)_");
      if (match === "off") {
        await automute.delete(message.jid);
        return await message.sendReply("_Auto-mute disabled!_");
      }
      var admin = await isAdmin(message);
      if (!admin) return await message.sendReply("_I need admin rights!_");
      await automute.set(message.jid, match.match(/(\d+)/g)?.join(" "));
      await message.sendReply(`_Group will auto-mute at ${tConvert(match.match(/(\d+)/g).join(" "))}_`);
    }
  }
);

// 👑 Auto-Unmute System
Module(
  {
    pattern: "autounmute ?(.*)",
    fromMe: false,
    desc: "Set auto-unmute time (24h format)",
    use: "group",
  },
  async (message, match) => {
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (message.fromOwner || adminAccess) {
      match = match[1]?.toLowerCase();
      if (!match) return await message.sendReply("_Example: .autounmute 06 00 (for 6 AM)_");
      if (match === "off") {
        await autounmute.delete(message.jid);
        return await message.sendReply("_Auto-unmute disabled!_");
      }
      var admin = await isAdmin(message);
      if (!admin) return await message.sendReply("_I need admin rights!_");
      await autounmute.set(message.jid, match?.match(/(\d+)/g)?.join(" "));
      await message.sendReply(`_Group will auto-open at ${tConvert(match)}_`);
    }
  }
);

// 👑 Anti-Fake System
Module(
  {
    pattern: "antifake ?(.*)",
    fromMe: false,
    use: "group",
    desc: "Remove fake/foreign numbers automatically",
  },
  async (message, match) => {
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (message.fromOwner || adminAccess) {
      var admin = await isAdmin(message);
      if (!admin) return await message.sendReply("_Admin rights required!_");
      if (match[1] === "on") {
        await antifake.set(message.jid);
        return await message.sendReply("_Antifake enabled!_");
      }
      if (match[1] === "off") {
        await antifake.delete(message.jid);
        return await message.sendReply("_Antifake disabled!_");
      }
      await message.sendReply("_Usage: .antifake on/off_");
    }
  }
);

// 👑 Group Updates Logic (Welcome, Anti-Promote, etc)
Module(
  {
    on: "group-update",
    fromMe: false,
  },
  async (message, match) => {
    // Logic for Promote/Demote/Add/Remove notifications in English...
    if (message.action == "promote" || message.action == "demote") {
       // Send English update message
       await message.client.sendMessage(message.jid, {
         text: `_User @${message.participant[0].id.split("@")[0]} was ${message.action}d by @${message.from.split("@")[0]}_`,
         mentions: [message.participant[0].id, message.from]
       });
    }
    // (Existing Welcome/Goodbye logic follows...)
  }
);
