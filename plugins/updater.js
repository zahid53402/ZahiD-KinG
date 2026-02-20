const simpleGit = require("simple-git");
const git = simpleGit();
const { Module } = require("../main");
const renderDeploy = require("./utils/render-api");
const config = require("../config");
const fs = require("fs").promises;
const axios = require("axios");

const BOT_BRAND = "ZAHID-KING-MD";
const handler = config.HANDLERS !== "false" ? config.HANDLERS.split("")[0] : "";
const localPackageJson = require("../package.json");

async function isGitRepo() {
  try {
    await fs.access(".git");
    return true;
  } catch (e) {
    return false;
  }
}

async function getRemoteVersion() {
  try {
    // Note: Update this URL to your own GitHub repo later for personal updates
    const remotePackageJsonUrl = `https://raw.githubusercontent.com/souravkl11/raganork-md/main/package.json`;
    const response = await axios.get(remotePackageJsonUrl);
    return response.data.version;
  } catch (error) {
    throw new Error("Failed to fetch remote version");
  }
}

Module(
  {
    pattern: "update ?(.*)",
    fromMe: true,
    desc: "Checks for and applies bot updates.",
    use: "owner",
  },
  async (message, match) => {
    if (!(await isGitRepo())) {
      return await message.sendReply(
        `_Error: This bot is not running from a Git repository. Update failed for ${BOT_BRAND}._`
      );
    }

    const command = match[1] ? match[1].toLowerCase() : "";
    const processingMsg = await message.sendReply(`_Checking for ${BOT_BRAND} updates..._`);

    try {
      await git.fetch();
      const commits = await git.log(["main" + "..origin/" + "main"]);
      const localVersion = localPackageJson.version;
      let remoteVersion;

      try {
        remoteVersion = await getRemoteVersion();
      } catch (error) {
        return await message.edit(
          "_Failed to fetch remote data. Please try again later._",
          message.jid,
          processingMsg.key
        );
      }

      const hasCommits = commits.total > 0;
      const versionChanged = remoteVersion !== localVersion;

      if (!hasCommits && !versionChanged) {
        return await message.edit(
          `_*${BOT_BRAND} is already up to date!*_`,
          message.jid,
          processingMsg.key
        );
      }

      const isBetaUpdate = hasCommits && !versionChanged;
      const isStableUpdate = hasCommits && versionChanged;

      if (!command) {
        let updateInfo = `*───「 ${BOT_BRAND} UPDATER 」───*\n\n`;

        if (isStableUpdate) {
          updateInfo += `*STABLE UPDATE AVAILABLE*\n\n`;
          updateInfo += `📦 *Current:* ${localVersion}\n`;
          updateInfo += `📦 *Latest:* ${remoteVersion}\n\n`;
        } else if (isBetaUpdate) {
          updateInfo += `*BETA COMMITS AVAILABLE*\n\n`;
          updateInfo += `⚠️ New patches are available for performance.\n\n`;
        }

        updateInfo += `*_CHANGELOG:_*\n`;
        for (let i in commits.all) {
          updateInfo += `${parseInt(i) + 1}• ${commits.all[i].message}\n`;
        }
        
        updateInfo += `\n_Use "${handler}update start" to apply stable update_`;
        updateInfo += `\n_Use "${handler}update beta" to apply beta patches_`;

        return await message.edit(updateInfo, message.jid, processingMsg.key);
      }

      if (command === "start" || command === "beta") {
        await message.edit(
          `_Applying updates to ${BOT_BRAND}... Please wait._`,
          message.jid,
          processingMsg.key
        );

        // Render Platform Update Logic
        if (process.env.RENDER_SERVICE_ID) {
          if (!config.RENDER_API_KEY) {
            return await message.edit("_Error: RENDER_API_KEY is missing!_", message.jid, processingMsg.key);
          }
          await renderDeploy(process.env.RENDER_SERVICE_ID, config.RENDER_API_KEY);
          return await message.edit("_Deployment started on Render platform!_", message.jid, processingMsg.key);
        }

        // Standard Git Update
        if (!__dirname.startsWith("/rgnk")) {
          await git.reset("hard", ["HEAD"]);
          await git.pull();
          await message.edit(
            `_✅ Update Successful! ${BOT_BRAND} is restarting..._`,
            message.jid,
            processingMsg.key
          );
          process.exit(0);
        } else {
          return await message.edit(
            "_Manual update required for this hosting platform._",
            message.jid,
            processingMsg.key
          );
        }
      } else {
        return await message.edit(
          `_Invalid command. Use "${handler}update start" or "${handler}update beta"._`,
          message.jid,
          processingMsg.key
        );
      }
    } catch (error) {
      return await message.edit(
        "_An error occurred during the update process._",
        message.jid,
        processingMsg.key
      );
    }
  }
);
