const { Module } = require("../main");
const { ADMIN_ACCESS, HANDLERS, WARN, SUDO } = require("../config");
const {
  isAdmin,
  getWarn,
  setWarn,
  resetWarn,
  decrementWarn,
  getWarnCount,
  getAllWarns,
} = require("./utils");

const BOT_BRAND = "ZAHID-KING-MD";
const handler = HANDLERS !== "false" ? HANDLERS.split("")[0] : "";
const warnLimit = parseInt(WARN || 4);
const sudoUsers = (SUDO || "").split(",");

// 👑 Command: Warn User
Module(
  {
    pattern: "warn ?(.*)",
    fromMe: false,
    desc: "Warn a user. Kicks after limit.",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_This command is for groups only!_");

    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (!message.fromOwner && !adminAccess) return;

    if (!(await isAdmin(message))) return await message.sendReply("_I need Admin privileges to manage warnings!_");

    const targetUser = message.mention?.[0] || message.reply_message?.jid;
    if (!targetUser) {
      return await message.sendReply(
        `*───「 ${BOT_BRAND} WARN 」───*\n\n` +
        `_Reply to a user or mention them to warn._\n\n` +
        `*Commands:* \n` +
        `• ${handler}warn (Give warning)\n` +
        `• ${handler}warnings (Check status)\n` +
        `• ${handler}rmwarn (Remove 1 warning)\n` +
        `• ${handler}resetwarn (Clear all)`
      );
    }

    if (await isAdmin(message, targetUser)) return await message.sendReply("_Cannot warn group admins!_");
    if (sudoUsers.includes(targetUser.split("@")[0])) return await message.sendReply("_Cannot warn bot owner!_");

    let reason = match[1] || "No reason provided";
    try {
      await setWarn(message.jid, targetUser, reason, message.sender);
      const warnData = await getWarn(message.jid, targetUser, warnLimit);

      if (warnData.exceeded) {
        await message.client.groupParticipantsUpdate(message.jid, [targetUser], "remove");
        await message.client.sendMessage(message.jid, {
          text: `*🚫 USER KICKED FROM ${BOT_BRAND}*\n\n*User:* @${targetUser.split("@")[0]}\n*Reason:* ${reason}\n*Status:* Warning Limit Exceeded (${warnLimit}/${warnLimit})`,
          mentions: [targetUser],
        });
      } else {
        await message.client.sendMessage(message.jid, {
          text: `*⚠️ WARNING ISSUED BY ${BOT_BRAND}*\n\n*User:* @${targetUser.split("@")[0]}\n*Reason:* ${reason}\n*Warnings:* ${warnData.current}/${warnLimit}\n*Remaining:* ${warnData.remaining}`,
          mentions: [targetUser],
        });
      }
    } catch (e) {
      await message.sendReply("_Error processing warning!_");
    }
  }
);

// 👑 Command: Check Warnings
Module(
  {
    pattern: "warnings ?(.*)",
    fromMe: false,
    desc: "Check user warnings",
    use: "group",
  },
  async (message) => {
    if (!message.isGroup) return await message.sendReply("_Groups only!_");
    const targetUser = message.mention?.[0] || message.reply_message?.jid || message.sender;
    
    try {
      const warnings = await getWarn(message.jid, targetUser);
      let count = warnings ? warnings.length : 0;
      let text = `*───「 ${BOT_BRAND} STATUS 」───*\n\n*User:* @${targetUser.split("@")[0]}\n*Warnings:* ${count}/${warnLimit}\n\n`;
      
      if (count > 0) {
        warnings.forEach((w, i) => {
          text += `*${i + 1}.* ${w.reason} (By: @${w.warnedBy.split("@")[0]})\n`;
        });
      } else {
        text += "_Status: Clean Record ✅_";
      }
      
      await message.client.sendMessage(message.jid, { text, mentions: [targetUser] });
    } catch (e) {
      await message.sendReply("_Error fetching warnings._");
    }
  }
);

// 👑 Command: Reset/Remove Warnings
Module(
  {
    pattern: "resetwarn ?(.*)",
    fromMe: false,
    desc: "Reset all warnings",
    use: "group",
  },
  async (message) => {
    if (!message.isGroup) return;
    if (!message.fromOwner && !(await isAdmin(message, message.sender))) return;

    const targetUser = message.mention?.[0] || message.reply_message?.jid;
    if (!targetUser) return await message.sendReply("_Mention a user to reset!_");

    await resetWarn(message.jid, targetUser);
    await message.client.sendMessage(message.jid, {
      text: `_✅ All warnings cleared for @${targetUser.split("@")[0]} by ${BOT_BRAND}_`,
      mentions: [targetUser]
    });
  }
);

// 👑 Command: Warn List
Module(
  {
    pattern: "warnlist",
    fromMe: false,
    desc: "List all warned users",
    use: "group",
  },
  async (message) => {
    if (!message.isGroup) return;
    try {
      const allWarnings = await getAllWarns(message.jid);
      if (Object.keys(allWarnings).length === 0) return await message.sendReply("_No users have warnings in this group._");

      let list = `*───「 ${BOT_BRAND} WARN LIST 」───*\n\n`;
      Object.entries(allWarnings).forEach(([jid, warns], i) => {
        list += `${i + 1}. @${jid.split("@")[0]} - (${warns.length}/${warnLimit})\n`;
      });
      await message.client.sendMessage(message.jid, { text: list, mentions: Object.keys(allWarnings) });
    } catch (e) {
      await message.sendReply("_Error loading list._");
    }
  }
);
