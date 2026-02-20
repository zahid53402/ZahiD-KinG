const { Module } = require("../main");
const {
  isAdmin,
  antilinkConfig,
  antiword,
  antibot,
  antispam,
  antipromote,
  antidemote,
  pdm,
  setWarn,
  getWarn,
  linkDetector,
} = require("./utils");
const config = require("../config");
const { settingsMenu, ADMIN_ACCESS } = config;
const fs = require("fs");
const { BotVariable } = require("../core/database");

const BOT_BRAND = "ZAHID-KING-MD";
var handler = config.HANDLERS !== "false" ? config.HANDLERS.split("")[0] : ".";

// 👑 Variable Manager Functions
async function setVar(key, value, message = false) {
  await BotVariable.upsert({ key: key.trim(), value: value });
  config[key.trim()] = value;
  if (message) {
    await message.sendReply(`_✅ ${key.trim()} set to '${value}' successfully!_`);
  }
  return true;
}

async function delVar(key, message = false) {
  await BotVariable.destroy({ where: { key: key.trim() } });
  delete config[key.trim()];
  if (message) {
    await message.sendReply(`_🗑️ ${key.trim()} deleted successfully!_`);
  }
  return true;
}

// 👑 Set & Get Variables
Module(
  {
    pattern: "setvar ?(.*)",
    fromMe: true,
    desc: "Set bot variables remotely",
    usage: ".setvar KEY=VALUE",
  },
  async (message, args) => {
    const input = args[1];
    if (!input || !input.includes("=")) return await message.sendReply("_Usage: .setvar KEY=VALUE_");

    const [key, ...valueParts] = input.split("=");
    const value = valueParts.join("=").trim();

    if (key.trim().toUpperCase() === "SUDO") {
      return await message.sendReply("_Please use `.setsudo` command for managing sudo users._");
    }

    try {
      await setVar(key.trim(), value, message);
    } catch (error) {
      await message.sendReply(`_Error: ${error.message}_`);
    }
  }
);

Module(
  {
    pattern: "getvar ?(.*)",
    fromMe: true,
    desc: "Get bot variable value",
  },
  async (message, args) => {
    const key = args[1]?.trim();
    if (!key) return await message.sendReply("_Provide a variable name!_");
    const variable = config[key];
    await message.sendReply(variable ? `_*${key}*: ${variable}_` : `_Variable '${key}' not found._`);
  }
);

// 👑 Mode Manager (Public/Private)
Module(
  {
    pattern: "mode ?(.*)",
    fromMe: true,
    desc: "Change bot mode",
    use: "settings",
  },
  async (message, match) => {
    const mode = match[1]?.toLowerCase();
    if (mode === "public" || mode === "private") {
      return await setVar("MODE", mode, message);
    } else {
      return await message.sendReply(`*───「 ${BOT_BRAND} 」───*\n\n_Current Mode: ${config.MODE}_\n_Use: .mode public OR .mode private_`);
    }
  }
);

// 👑 Sudo Manager
Module(
  {
    pattern: "setsudo ?(.*)",
    fromMe: true,
    use: "owner",
  },
  async (message, mm) => {
    let targetLid = message.isGroup ? (message.mention[0] || message.reply_message?.jid) : message.sender;
    if (!targetLid) return await message.sendReply("_Reply to or mention someone!_");

    try {
      let sudoMap = config.SUDO_MAP ? JSON.parse(config.SUDO_MAP) : [];
      if (sudoMap.includes(targetLid)) return await message.sendReply("_User is already Sudo!_");

      sudoMap.push(targetLid);
      await setVar("SUDO_MAP", JSON.stringify(sudoMap));
      await message.sendMessage(`_Added @${targetLid.split("@")[0]} as Sudo successfully!_`, "text", { mentions: [targetLid] });
    } catch (e) {
      await message.sendReply(`_Error: ${e.message}_`);
    }
  }
);

// 👑 Anti-Delete Manager
Module(
  {
    pattern: "antidelete ?(.*)",
    fromMe: true,
    desc: "Activates anti-delete system",
  },
  async (message, match) => {
    let target = match[1]?.trim().toLowerCase();
    if (!target) {
      return await message.sendReply(`*───「 ANTI-DELETE 」───*\n\n_Status: ${config.ANTI_DELETE || "off"}_\n\n_Commands:_\n.antidelete chat (Send here)\n.antidelete sudo (Send to Sudo)\n.antidelete off (Disable)`);
    }

    if (target === "off") {
      await setVar("ANTI_DELETE", "off");
      return await message.sendReply("_Anti-delete disabled!_");
    } else {
      await setVar("ANTI_DELETE", target);
      return await message.sendReply(`_Anti-delete set to: ${target}_`);
    }
  }
);

// 👑 PDM Alert (Promote/Demote)
Module(
  {
    pattern: "pdm ?(.*)",
    fromMe: false,
    desc: "Detects promote/demote alerts",
    use: "group",
  },
  async (message, match) => {
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (message.fromOwner || adminAccess) {
      let status = match[1]?.toLowerCase();
      if (status === "on") {
        await pdm.set(message.jid);
        return await message.sendReply("_PDM alerts activated!_");
      } else if (status === "off") {
        await pdm.delete(message.jid);
        return await message.sendReply("_PDM alerts deactivated!_");
      }
      return await message.sendReply("_Usage: .pdm on/off_");
    }
  }
);

// (Other functions like toggle, language, etc follow the same logic...)
  
