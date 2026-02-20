const { loadBaileys } = require("../core/helpers");
const { isAdmin, isNumeric, mentionjid } = require("./utils");
const { ADMIN_ACCESS, HANDLERS, MODE } = require("../config");
const { Module } = require("../main");
const { getFullMessage } = require("../core/store");

const BOT_BRAND = "ZAHID-KING-MD";

Module(
  {
    pattern: "clear ?(.*)",
    fromMe: true,
    desc: "Clear chat history",
    use: "misc",
  },
  async (message, match) => {
    await message.client.chatModify(
      {
        delete: true,
        lastMessages: [
          {
            key: message.data.key,
            messageTimestamp: message.data.messageTimestamp,
          },
        ],
      },
      message.jid
    );
    return await message.send("_Chat history cleared!_");
  }
);

Module(
  {
    pattern: "kick ?(.*)",
    fromMe: false,
    desc: "Kicks a member from the group",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_This is a group command!_");
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    
    if (message.fromOwner || adminAccess) {
      const user = message.mention?.[0] || message.reply_message?.jid;
      if (!user) return await message.sendReply("_Reply to someone or mention them to kick!_");
      
      const botAdmin = await isAdmin(message);
      if (!botAdmin) return await message.sendReply("_I need to be an Admin to kick someone!_");

      await message.client.groupParticipantsUpdate(message.jid, [user], "remove");
      return await message.send(`_User @${user.split("@")[0]} has been kicked!_`, { mentions: [user] });
    }
  }
);

Module(
  {
    pattern: "promote ?(.*)",
    fromMe: false,
    use: "group",
    desc: "Promotes a member to Admin",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_This is a group command!_");
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    
    if (message.fromOwner || adminAccess) {
      const user = message.mention?.[0] || message.reply_message?.jid;
      if (!user) return await message.sendReply("_Reply to someone to promote!_");
      
      const botAdmin = await isAdmin(message);
      if (!botAdmin) return await message.sendReply("_I need to be an Admin!_");

      await message.client.groupParticipantsUpdate(message.jid, [user], "promote");
      await message.send(`_@${user.split("@")[0]} is now an Admin!_`, { mentions: [user] });
    }
  }
);

Module(
  {
    pattern: "mute ?(.*)",
    use: "group",
    fromMe: false,
    desc: "Mutes the group (Admins only)",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_This is a group command!_");
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    
    if (message.fromOwner || adminAccess) {
      const botAdmin = await isAdmin(message);
      if (!botAdmin) return await message.sendReply("_Admin rights required!_");
      
      await message.client.groupSettingUpdate(message.jid, "announcement");
      await message.send(`*───「 ${BOT_BRAND} 」───*\n\n_Group has been muted! Only admins can send messages._`);
    }
  }
);

Module(
  {
    pattern: "unmute",
    use: "group",
    fromMe: false,
    desc: "Unmutes the group",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_This is a group command!_");
    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    
    if (message.fromOwner || adminAccess) {
      const botAdmin = await isAdmin(message);
      if (!botAdmin) return await message.sendReply("_Admin rights required!_");
      
      await message.client.groupSettingUpdate(message.jid, "not_announcement");
      await message.send(`*───「 ${BOT_BRAND} 」───*\n\n_Group has been unmuted! Everyone can send messages._`);
    }
  }
);

Module(
  {
    pattern: "invite",
    fromMe: false,
    use: "group",
    desc: "Generates group invite link",
  },
  async (message) => {
    if (!message.isGroup) return await message.sendReply("_Group command only!_");
    const botAdmin = await isAdmin(message);
    if (!botAdmin) return await message.sendReply("_I am not an Admin!_");
    
    const code = await message.client.groupInviteCode(message.jid);
    await message.send(`*Invite Link:* \nhttps://chat.whatsapp.com/${code}`);
  }
);

Module(
  {
    pattern: "leave",
    fromMe: true,
    desc: "Makes the bot leave the group",
    use: "group",
  },
  async (message) => {
    if (!message.isGroup) return await message.sendReply("_Group command only!_");
    await message.send("_Goodbye! Leaving the group..._");
    return await message.client.groupLeave(message.jid);
  }
);
