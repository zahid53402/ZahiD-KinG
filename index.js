const path = require("path");
const fs = require("fs");
if (fs.existsSync("./config.env")) {
  require("dotenv").config({ path: "./config.env" });
}

const { suppressLibsignalLogs } = require("./core/helpers");

suppressLibsignalLogs();

const { initializeDatabase } = require("./core/database");
const { BotManager } = require("./core/manager");
const config = require("./config");
const { SESSION, logger } = config;
const http = require("http");
const {
  ensureTempDir,
  TEMP_DIR,
  initializeKickBot,
  cleanupKickBot,
} = require("./core/helpers");

async function main() {
  ensureTempDir();
  logger.info(`Created temporary directory at ${TEMP_DIR}`);
  
  // 👑 Zahid King Branding
  console.log(`ZAHID-KING-MD v${config.VERSION}`);
  console.log(`- Developer: Zᴀʜɪᴅ Kɪɴɢ`);
  console.log(`- Configured sessions: ${SESSION.length}`);
  
  if (SESSION.length === 0) {
    const warnMsg = "⚠️ No sessions found. Please set SESSION_ID.";
    console.warn(warnMsg);
    return;
  }

  try {
    await initializeDatabase();
    console.log("- Database initialized (SQLite/Postgres)");
  } catch (dbError) {
    console.error("🚫 Database Connection Failed!", dbError);
    process.exit(1);
  }

  const botManager = new BotManager();

  const shutdownHandler = async (signal) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    cleanupKickBot();
    await botManager.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdownHandler("SIGINT"));
  process.on("SIGTERM", () => shutdownHandler("SIGTERM"));

  await botManager.initializeBots();
  console.log("✅ ZAHID-KING-MD IS NOW ONLINE!");

  initializeKickBot();

  const startServer = () => {
    const PORT = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ZAHID-KING-MD is running perfectly!");
    });
    server.listen(PORT);
  };

  if (process.env.USE_SERVER !== "false") startServer();
}

if (require.main === module) {
  main().catch((error) => {
    process.exit(1);
  });
}
