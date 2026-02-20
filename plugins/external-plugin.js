const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");
const fs = require("fs");
const { PluginDB, installPlugin } = require("./sql/plugin");

// 👑 ZAHID-KING: External Plugin Management
const BOT_BRAND = "ZAHID-KING-MD";

Module(
  {
    pattern: "install ?(.*)",
    fromMe: true,
    use: "owner",
    desc: "Installs an external plugin from a URL",
  },
  async (message, match) => {
    match = match[1] !== "" ? match[1] : message.reply_message.text;
    if (!match || !/\bhttps?:\/\/\S+/gi.test(match))
      return await message.send("_Please provide a valid Plugin URL!_");

    let links = match.match(/\bhttps?:\/\/\S+/gi);
    for (let link of links) {
      try {
        var url = new URL(link);
      } catch {
        return await message.send("_Invalid URL format!_");
      }

      if (url.host === "gist.github.com" || url.host === "gist.githubusercontent.com") {
        url = !url?.toString().endsWith("raw") ? url.toString() + "/raw" : url.toString();
      } else {
        url = url.toString();
      }

      try {
        var response = await axios(url + "?timestamp=" + new Date());
      } catch {
        return await message.send("_Could not fetch the plugin from the URL!_");
      }

      let plugin_name = /pattern: ["'](.*)["'],/g.exec(response.data);
      if (!plugin_name) return await message.sendReply("_Invalid plugin: No command pattern found!_");

      plugin_name = plugin_name[1].split(" ")[0];
      fs.writeFileSync("./plugins/" + plugin_name + ".js", response.data);

      try {
        require("./" + plugin_name);
      } catch (e) {
        fs.unlinkSync(__dirname + "/" + plugin_name + ".js");
        return await message.sendReply(`_Plugin installation failed: ${e.message}_`);
      }

      await installPlugin(url, plugin_name);
      await message.send(`_Successfully installed plugin: *${plugin_name}*_`);
    }
  }
);

Module(
  {
    pattern: "plugin ?(.*)",
    fromMe: true,
    use: "owner",
    desc: "Lists all installed external plugins",
  },
  async (message, match) => {
    var plugins = await PluginDB.findAll();
    if (match[1] !== "") {
      var plugin = plugins.filter((_plugin) => _plugin.dataValues.name === match[1]);
      try {
        return await message.sendReply(`*Plugin:* ${plugin[0].dataValues.name}\n*URL:* ${plugin[0].dataValues.url}`);
      } catch {
        return await message.sendReply("_Plugin not found!_");
      }
    }

    if (plugins.length < 1) {
      return await message.send("_No external plugins installed._");
    } else {
      let msg = `*───「 ${BOT_BRAND} PLUGINS 」───*\n\n`;
      plugins.forEach((plugin) => {
        msg += `• *${plugin.dataValues.name}*\n  ${plugin.dataValues.url.replace("/raw", "")}\n\n`;
      });
      return await message.sendReply(msg);
    }
  }
);

Module(
  {
    pattern: "remove ?(.*)",
    fromMe: true,
    use: "owner",
    desc: "Removes an installed plugin",
  },
  async (message, match) => {
    if (match[1] === "") return await message.send("_Please provide the plugin name to remove!_");
    var plugin = await PluginDB.findAll({ where: { name: match[1] } });

    if (plugin.length < 1) {
      return await message.send("_Plugin not found!_");
    } else {
      await plugin[0].destroy();
      delete require.cache[require.resolve("./" + match[1] + ".js")];
      fs.unlinkSync("./plugins/" + match[1] + ".js");
      await message.sendReply(`_Plugin *${match[1]}* has been removed._`);
    }
  }
);

Module(
  {
    pattern: "pupdate ?(.*)",
    fromMe: true,
    use: "owner",
    desc: "Updates an installed plugin",
  },
  async (m, match) => {
    const plugin = match[1];
    if (!plugin) return await m.send("_Provide the plugin name to update!_");
    
    var plugins = await PluginDB.findAll({ where: { name: plugin } });
    if (plugins.length < 1) return await m.send("_Plugin not found!_");

    var url = plugins[0].dataValues.url;
    try {
      var response = await axios(url + "?timestamp=" + new Date());
      fs.writeFileSync("./plugins/" + plugin + ".js", response.data);
      delete require.cache[require.resolve("./" + plugin + ".js")];
      require("./" + plugin);
      await m.send(`_Plugin *${plugin}* updated successfully! Restarting..._`);
      process.exit(0);
    } catch (e) {
      return await m.send(`_Update failed: ${e.message}_`);
    }
  }
);
