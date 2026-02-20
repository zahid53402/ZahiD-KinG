const { Module } = require("../main");
const { ADMIN_ACCESS, HANDLERS } = require("../config");
const { isAdmin, filter } = require("./utils");

const handler = HANDLERS !== "false" ? HANDLERS.split("")[0] : ".";
const BOT_BRAND = "ZAHID-KING-MD";

Module(
  {
    pattern: "filter ?(.*)",
    fromMe: false,
    desc: "Create auto-reply filters.",
    usage: ".filter trigger | response",
    use: "utility",
  },
  async (message, match) => {
    if (match[0].includes("filters")) return;
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (!message.fromOwner && !adminAccess) return;

    const input = match[1]?.trim();
    if (!input) {
      return await message.sendReply(
        `*👑 ${BOT_BRAND} FILTER SYSTEM*\n\n` +
          `• \`${handler}filter trigger | response\` - Create chat filter\n` +
          `• \`${handler}filter trigger | response | global\` - Create global filter\n` +
          `• \`${handler}filters\` - List all active filters\n` +
          `• \`${handler}delfilter trigger\` - Delete a filter\n\n` +
          `*Scopes:* chat, global, group, dm\n` +
          `*Options:* exact, case`
      );
    }

    const parts = input.split("|").map((p) => p.trim());
    if (parts.length < 2) {
      return await message.sendReply("_Usage: trigger | response | scope | options_");
    }

    const trigger = parts[0];
    const response = parts[1];
    const scope = parts[2] || "chat";
    const options = parts[3] || "";

    if (!trigger || !response) return await message.sendReply("_Trigger and Response are required!_");

    const filterOptions = {
      caseSensitive: options.includes("case"),
      exactMatch: options.includes("exact"),
    };

    try {
      await filter.set(trigger, response, message.jid, scope, message.sender, filterOptions);
      await message.sendReply(`✅ *Filter Created!*\n\n*Trigger:* ${trigger}\n*Response:* ${response}\n*Scope:* ${scope}`);
    } catch (error) {
      await message.sendReply("_Error: Failed to create filter!_");
    }
  }
);

Module(
  {
    pattern: "filters ?(.*)",
    fromMe: false,
    desc: "List all active filters",
    use: "utility",
  },
  async (message, match) => {
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (!message.fromOwner && !adminAccess) return;

    try {
      const filters = await filter.get(message.jid);
      if (!filters || filters.length === 0) return await message.sendReply("_No filters found!_");

      let msg = `*📝 ${BOT_BRAND} ACTIVE FILTERS*\n\n`;
      filters.forEach((f, index) => {
        msg += `${index + 1}. *${f.trigger}* ➔ ${f.response.substring(0, 20)}...\n`;
      });
      await message.sendReply(msg);
    } catch (error) {
      await message.sendReply("_Error: Could not fetch filters!_");
    }
  }
);

Module(
  {
    pattern: "delfilter ?(.*)",
    fromMe: false,
    desc: "Delete a filter",
    use: "utility",
  },
  async (message, match) => {
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (!message.fromOwner && !adminAccess) return;

    const trigger = match[1]?.trim();
    if (!trigger) return await message.sendReply("_Provide a filter trigger to delete!_");

    try {
      const deleted = await filter.delete(trigger, message.jid, "chat");
      if (deleted > 0) await message.sendReply(`✅ _Filter "${trigger}" deleted!_`);
      else await message.sendReply(`❌ _Filter not found!_`);
    } catch (error) {
      await message.sendReply("_Error: Could not delete filter!_");
    }
  }
);
