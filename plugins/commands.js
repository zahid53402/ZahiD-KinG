const { commands, Module } = require("../main");
const { MODE, HANDLERS, ALIVE, VERSION } = require("../config");
const config = require("../config");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { uploadToImgbb } = require("./utils/upload");
const { setVar } = require("./manage");
const { getTotalUserCount } = require("../core/store");
const { parseAliveMessage, sendAliveMessage } = require("./utils/alive-parser");

const isPrivateMode = MODE === "private";

// Branding Constant
const BOT_BRAND = "ZAHID-KING-MD";

const extractCommandName = (pattern) => {
  const match = pattern?.toString().match(/(\W*)([A-Za-z1234567890 ]*)/);
  return match && match[2] ? match[2].trim() : "";
};

Module(
  {
    pattern: "info ?(.*)",
    fromMe: isPrivateMode,
    desc: "Provides command details",
  },
  async (message, args) => {
    const commandName = args[1]?.trim();
    if (!commandName) return await message.sendReply("_Provide a command name. Example: .info insta_");

    const foundCommand = commands.find(cmd => extractCommandName(cmd.pattern) === commandName);
    if (!foundCommand) return await message.sendReply(`_Command '${commandName}' not found._`);

    let infoMessage = `*───「 ${BOT_BRAND} INFO 」───*\n\n`;
    infoMessage += `• *Command:* \`${commandName}\`\n`;
    infoMessage += `• *Description:* ${foundCommand.desc || "N/A"}\n`;
    infoMessage += `• *Access:* ${foundCommand.fromMe ? "Owner Only" : "Public"}\n`;
    await message.sendReply(infoMessage);
  }
);

// Custom Alive Function (English Only)
async function parseAlive(message, aliveMessage) {
  if (!aliveMessage) return await message.sendReply(`*${BOT_BRAND} is Active!*`);
  const parsedMessage = await parseAliveMessage(aliveMessage, message);
  if (parsedMessage) await sendAliveMessage(message, parsedMessage);
  else await message.sendReply(aliveMessage);
}

Module(
  {
    pattern: "alive",
    fromMe: isPrivateMode,
    desc: "Checks bot status",
  },
  async (message, match) => {
    await parseAlive(message, ALIVE);
  }
);

Module(
  {
    pattern: "menu",
    fromMe: isPrivateMode,
    use: "utility",
    desc: "Displays the main menu.",
  },
  async (message, match) => {
    const star = "✦";
    let types = [...new Set(commands.filter((e) => e.pattern).map((e) => e.use || "General"))];

    let cmd_obj = {};
    for (const command of commands) {
      let type_det = command.use || "General";
      if (!cmd_obj[type_det]?.length) cmd_obj[type_det] = [];
      let cmd_name = extractCommandName(command.pattern);
      if (cmd_name) cmd_obj[type_det].push(cmd_name);
    }

    const handlerPrefix = HANDLERS !== "false" ? HANDLERS.split("")[0] : ".";
    const infoParts = config.BOT_INFO.split(";");
    const botName = infoParts[0] || BOT_BRAND;
    const botOwner = infoParts[1] || "Zahid King";

    let menu = `╭═══〘 \`${botName}\` 〙═══⊷❍\n`;
    menu += `┃${star}│ *Owner:* ${botOwner}\n`;
    menu += `┃${star}│ *User:* ${message.senderName}\n`;
    menu += `┃${star}│ *Version:* ${VERSION}\n`;
    menu += `┃${star}│ *RAM:* ${Math.round(os.freemem() / 1024 / 1024)}MB Free\n`;
    menu += `╰═════════════════⊷❍\n\n`;

    for (const n of types) {
      menu += `*───「 ${n.toUpperCase()} 」───*\n`;
      cmd_obj[n].forEach(cmd => {
        menu += `• \`${handlerPrefix}${cmd}\`\n`;
      });
      menu += `\n`;
    }

    await message.sendReply(menu.trim());
  }
);

module.exports = { parseAlive };
