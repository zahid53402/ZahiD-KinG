const P = require("pino");
const fs = require("fs");
const { Sequelize } = require("sequelize");

function convertToBool(text, fault = "true", fault2 = "on") {
  return text === fault || text === fault2;
}

const isVPS = !(__dirname.startsWith("/rgnk") || __dirname.startsWith("/skl"));
const isHeroku = __dirname.startsWith("/skl");
const isKoyeb = __dirname.startsWith("/rgnk");
const isRailway = __dirname.startsWith("/railway");

const logger = P({ level: process.env.LOG_LEVEL || "silent" });

function applySQLiteResilience(sequelizeInstance) {
  if (!sequelizeInstance || sequelizeInstance.__sqliteGuardsApplied) {
    return;
  }
  sequelizeInstance.__sqliteGuardsApplied = true;
  const busyTimeoutMs = parseInt(process.env.SQLITE_BUSY_TIMEOUT || "15000", 10);
  const pragmas = [
    "PRAGMA journal_mode=WAL;",
    "PRAGMA synchronous=NORMAL;",
    "PRAGMA temp_store=MEMORY;",
    "PRAGMA cache_size=-32000;",
    `PRAGMA busy_timeout=${busyTimeoutMs};`,
  ];
  sequelizeInstance.addHook("afterConnect", async (connection) => {
    if (!connection || typeof connection.exec !== "function") return;
    try {
      for (const pragma of pragmas) {
        await new Promise((resolve, reject) => {
          connection.exec(pragma, (err) => (err ? reject(err) : resolve()));
        });
      }
    } catch (error) {
      logger.warn({ err: error }, "failed to apply sqlite pragmas");
    }
  });
}

const MAX_RECONNECT_ATTEMPTS = parseInt(process.env.MAX_RECONNECT_ATTEMPTS || "5", 10);
const VERSION = "6.2.26"; 
const DATABASE_URL = process.env.DATABASE_URL === undefined ? "./bot.db" : process.env.DATABASE_URL;
const DEBUG = process.env.DEBUG === undefined ? false : convertToBool(process.env.DEBUG);

const sequelize = (() => {
  if (DATABASE_URL === "./bot.db") {
    const sqliteInstance = new Sequelize({
      dialect: "sqlite",
      storage: DATABASE_URL,
      logging: DEBUG,
      retry: { match: [/SQLITE_BUSY/, /database is locked/, /EBUSY/], max: 3 },
      pool: { max: 5, min: 1, acquire: 30000, idle: 10000 },
    });
    applySQLiteResilience(sqliteInstance);
    return sqliteInstance;
  }
  return new Sequelize(DATABASE_URL, {
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: DEBUG,
    pool: { max: 20, min: 5, acquire: 30000, idle: 10000 },
  });
})();

const SESSION_STRING = process.env.SESSION || process.env.SESSION_ID;
const SESSION = SESSION_STRING ? SESSION_STRING.split(",").map((s) => s.trim()) : [];

const settingsMenu = [
  { title: "PM antispam block", env_var: "PM_ANTISPAM" },
  { title: "Auto read all messages", env_var: "READ_MESSAGES" },
  { title: "Auto read command messages", env_var: "READ_COMMAND" },
  { title: "Auto read status updates", env_var: "AUTO_READ_STATUS" },
  { title: "Admin sudo (group commands)", env_var: "ADMIN_ACCESS" },
  { title: "With & without handler mode", env_var: "MULTI_HANDLERS" },
  { title: "Auto reject calls", env_var: "REJECT_CALLS" },
  { title: "Always online", env_var: "ALWAYS_ONLINE" },
  { title: "PM Auto blocker", env_var: "PMB_VAR" },
  { title: "Disable bot in PM", env_var: "DIS_PM" },
  { title: "Disable bot startup message", env_var: "DISABLE_START_MESSAGE" },
];

const baseConfig = {
  VERSION,
  ALIVE: process.env.ALIVE || "👑 *ZAHID-KING-MD IS ACTIVE* \n\n*Owner:* Zᴀʜɪᴅ Kɪɴɢ\n*Telegram:* https://t.me/ZAHID_AERI\n*Group:* https://chat.whatsapp.com/LwcrjuLxfTj9WP1AoWXZeS",
  BLOCK_CHAT: process.env.BLOCK_CHAT || "",
  PM_ANTISPAM: convertToBool(process.env.PM_ANTISPAM) || false,
  ALWAYS_ONLINE: convertToBool(process.env.ALWAYS_ONLINE) || true,
  MANGLISH_CHATBOT: convertToBool(process.env.MANGLISH_CHATBOT) || false,
  ADMIN_ACCESS: convertToBool(process.env.ADMIN_ACCESS) || true,
  PLATFORM: isHeroku ? "Heroku" : isRailway ? "Railway" : isKoyeb ? "Koyeb" : "Linux",
  isHeroku, isKoyeb, isVPS, isRailway,
  AUTOMUTE_MSG: process.env.AUTOMUTE_MSG || "_Group automuted by ZAHID-KING-MD!_",
  MULTI_HANDLERS: convertToBool(process.env.MULTI_HANDLERS) || false,
  DISABLE_START_MESSAGE: convertToBool(process.env.DISABLE_START_MESSAGE) || false,
  AUTO_READ_STATUS: convertToBool(process.env.AUTO_READ_STATUS) || true,
  READ_MESSAGES: convertToBool(process.env.READ_MESSAGES) || false,
  PMB_VAR: convertToBool(process.env.PMB_VAR) || false,
  REJECT_CALLS: convertToBool(process.env.REJECT_CALLS) || false,
  PMB: process.env.PMB || "_PM not allowed by ZAHID-KING-MD!_",
  READ_COMMAND: convertToBool(process.env.READ_COMMAND) || true,
  BOT_INFO: "ZAHID-KING;ZAHID-AERI;https://i.ibb.co/VW6bKzL5/temp.jpg",
  BOT_NAME: "ZAHID-KING-MD",
  OWNER_NAME: "Zᴀʜɪᴅ Kɪɴɢ",
  SUDO: process.env.SUDO || "923044154575,923472291727",
  HANDLERS: process.env.HANDLERS || ".",
  STICKER_DATA: "ZAHID-KING;+923472291727",
  AUDIO_DATA: "ZAHID-KING;ZAHID-AERI;https://i.ibb.co/VW6bKzL5/temp.jpg",
  MODE: process.env.MODE || "public",
  SUPPORT_GROUP: "https://chat.whatsapp.com/LwcrjuLxfTj9WP1AoWXZeS",
  TELEGRAM_LINK: "https://t.me/ZAHID_AERI",
  settingsMenu,
  SESSION,
  logger,
  MAX_RECONNECT_ATTEMPTS,
  sequelize,
  DATABASE_URL,
  DEBUG,
};

// --- Proxy logic remains unchanged to ensure system stability ---
const dynamicValues = new Map();
const config = new Proxy(baseConfig, {
  get(target, prop) {
    const key = typeof prop === "symbol" ? prop.toString() : prop;
    if (key === "toJSON" || key === "valueOf") return () => ({ ...target, ...Object.fromEntries(dynamicValues) });
    if (dynamicValues.has(key)) return dynamicValues.get(key);
    if (key in target) return target[key];
    if (typeof key === "string" && process.env[key] !== undefined) return process.env[key];
    return undefined;
  },
  set(target, prop, value) {
    dynamicValues.set(prop.toString(), value);
    return true;
  },
  has(target, prop) {
    const key = typeof prop === "symbol" ? prop.toString() : prop;
    return dynamicValues.has(key) || key in target || (typeof key === "string" && key in process.env);
  },
  ownKeys(target) {
    return [...new Set([...Object.keys(target), ...Array.from(dynamicValues.keys()).filter(k => typeof k === "string")])];
  },
  getOwnPropertyDescriptor(target, prop) {
    return { enumerable: true, configurable: true, value: this.get(target, prop) };
  },
});

module.exports = config;
