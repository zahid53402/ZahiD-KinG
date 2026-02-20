const { Module } = require("../main");

const BOT_BRAND = "ZAHID-KING-MD";

Module(
  {
    pattern: "reload",
    fromMe: true,
    desc: "Reloads the bot modules",
    excludeFromCommands: true,
  },
  async (message) => {
    await message.sendReply(`_🔄 ${BOT_BRAND} is reloading..._`);
    process.exit(0);
  }
);

Module(
  {
    pattern: "reboot",
    fromMe: true,
    desc: "Reboots the bot system",
    excludeFromCommands: true,
  },
  async (message) => {
    await message.sendReply(`_🔄 ${BOT_BRAND} is rebooting..._`);
    process.exit(0);
  }
);

Module(
  {
    pattern: "restart",
    fromMe: true,
    desc: "Restarts the bot completely",
    use: "system",
  },
  async (message) => {
    await message.sendReply(`_🚀 Restarting ${BOT_BRAND}... Please wait a moment._`);
    process.exit(0);
  }
);
