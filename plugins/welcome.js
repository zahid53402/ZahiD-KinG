const { Module } = require("../main");
const { ADMIN_ACCESS, HANDLERS } = require("../config");
const { isAdmin, welcome, goodbye } = require("./utils");
const {
  parseWelcomeMessage,
  sendWelcomeMessage,
} = require("./utils/welcome-parser");

const BOT_BRAND = "ZAHID-KING-MD";
var handler = HANDLERS !== "false" ? HANDLERS.split("")[0] : "";

// 👑 Welcome Command Logic
Module(
  {
    pattern: "welcome ?(.*)",
    fromMe: false,
    desc: "Set or manage group welcome messages.",
    use: "group",
  },
  async (message, match) => {
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (!message.fromOwner && !adminAccess) return;

    const input = match[1]?.toLowerCase();
    
    // Help Menu
    if (!input) {
      return await message.sendReply(`*───「 ${BOT_BRAND} WELCOME 」───*

*Usage:*
• \`${handler}welcome <text>\` - Set welcome message
• \`${handler}welcome on/off\` - Enable/Disable
• \`${handler}welcome get\` - View current message
• \`${handler}welcome del\` - Delete message
• \`${handler}testwelcome\` - Test current setup

*Placeholders:*
$mention, $user, $group, $count, $pp, $gpp, $date, $time

*Example:*
\`${handler}welcome Hey $mention, Welcome to $group! $pp\``);
    }

    if (input === "on") {
      const current = await welcome.get(message.jid);
      if (!current) return await message.sendReply(`_Please set a message first using ${handler}welcome <text>_`);
      await welcome.toggle(message.jid, true);
      return await message.sendReply(`_Welcome messages enabled for this group!_ ✅`);
    }

    if (input === "off") {
      await welcome.toggle(message.jid, false);
      return await message.sendReply(`_Welcome messages disabled!_ ❌`);
    }

    if (input === "get") {
      const current = await welcome.get(message.jid);
      if (!current) return await message.sendReply(`_No welcome message set for this group!_`);
      return await message.sendReply(`*Current Welcome Message:*\n\n${current.message}\n\n*Status:* ${current.enabled ? "Active ✅" : "Inactive ❌"}`);
    }

    if (input === "del" || input === "delete") {
      await welcome.delete(message.jid);
      return await message.sendReply(`_Welcome message deleted successfully!_ 🗑️`);
    }

    // Set Welcome Message
    const welcomeMessage = match[1];
    if (welcomeMessage.length > 2000) return await message.sendReply("_Message too long! Max 2000 chars._");
    
    await welcome.set(message.jid, welcomeMessage);
    await message.sendReply(`_Welcome message updated for ${BOT_BRAND}!_ ✅\n\n*Preview:*\n${welcomeMessage}`);
  }
);

// 👑 Goodbye Command Logic
Module(
  {
    pattern: "goodbye ?(.*)",
    fromMe: false,
    desc: "Set or manage group goodbye messages.",
    use: "group",
  },
  async (message, match) => {
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (!message.fromOwner && !adminAccess) return;

    const input = match[1]?.toLowerCase();
    
    if (!input) {
      return await message.sendReply(`*───「 ${BOT_BRAND} GOODBYE 」───*

*Usage:*
• \`${handler}goodbye <text>\` - Set goodbye message
• \`${handler}goodbye on/off\` - Enable/Disable
• \`${handler}goodbye get\` - View current
• \`${handler}goodbye del\` - Delete message
• \`${handler}testgoodbye\` - Test current setup

*Example:*
\`${handler}goodbye Goodbye $user, we will miss you! $pp\``);
    }

    if (input === "on") {
      const current = await goodbye.get(message.jid);
      if (!current) return await message.sendReply("_Set a goodbye message first!_");
      await goodbye.toggle(message.jid, true);
      return await message.sendReply("_Goodbye messages enabled!_ ✅");
    }

    if (input === "off") {
      await goodbye.toggle(message.jid, false);
      return await message.sendReply("_Goodbye messages disabled!_ ❌");
    }

    if (input === "get") {
      const current = await goodbye.get(message.jid);
      if (!current) return await message.sendReply("_No goodbye message set!_");
      return await message.sendReply(`*Current Goodbye:* ${current.message}`);
    }

    if (input === "del") {
      await goodbye.delete(message.jid);
      return await message.sendReply("_Goodbye message removed!_ 🗑️");
    }

    const goodbyeMessage = match[1];
    await goodbye.set(message.jid, goodbyeMessage);
    await message.sendReply(`_Goodbye message updated for ${BOT_BRAND}!_ ✅`);
  }
);

// 👑 Test Commands
Module(
  {
    pattern: "testwelcome ?(.*)",
    fromMe: false,
    desc: "Test current welcome setup",
    use: "group",
  },
  async (message) => {
    const data = await welcome.get(message.jid);
    if (!data || !data.enabled) return await message.sendReply("_Welcome is not set or disabled!_");
    const parsed = await parseWelcomeMessage(data.message, message, [message.sender]);
    await message.sendReply(`*Testing ${BOT_BRAND} Welcome:*`);
    await sendWelcomeMessage(message, parsed);
  }
);

Module(
  {
    pattern: "testgoodbye ?(.*)",
    fromMe: false,
    desc: "Test current goodbye setup",
    use: "group",
  },
  async (message) => {
    const data = await goodbye.get(message.jid);
    if (!data || !data.enabled) return await message.sendReply("_Goodbye is not set or disabled!_");
    const parsed = await parseWelcomeMessage(data.message, message, [message.sender]);
    await message.sendReply(`*Testing ${BOT_BRAND} Goodbye:*`);
    await sendWelcomeMessage(message, parsed);
  }
);
