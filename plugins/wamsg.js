const { Module } = require("../main");
const { isAdmin } = require("./utils");
const { ADMIN_ACCESS, MODE } = require("../config");
const isPrivateMode = MODE !== "public";

const BOT_BRAND = "ZAHID-KING-MD";

// 👑 React to a message
Module(
  {
    pattern: "react ?(.*)",
    fromMe: true,
    desc: "React to a replied message with an emoji",
    use: "whatsapp",
  },
  async (m, t) => {
    if (!m.reply_message) return await m.sendReply("_Reply to a message to react!_");
    let msg = {
      remoteJid: m.reply_message?.jid,
      id: m.reply_message.id,
    };
    const reactionMessage = {
      react: {
        text: t[1] || "❤️",
        key: msg,
      },
    };
    await m.client.sendMessage(m.jid, reactionMessage);
  }
);

// 👑 Edit your sent message
Module(
  {
    pattern: "edit ?(.*)",
    fromMe: true,
    desc: "Edits a message sent by the bot",
    use: "whatsapp",
  },
  async (m, t) => {
    if (t[1] && m.reply_message?.text && m.quoted.key.fromMe) {
      await m.edit(t[1], m.jid, m.quoted.key);
    } else {
      await m.sendReply("_Reply to your own message to edit it!_");
    }
  }
);

// 👑 Send message to another JID
Module(
  {
    pattern: "send ?(.*)",
    fromMe: true,
    desc: "Send a replied message to a specific JID",
    use: "whatsapp",
  },
  async (m, t) => {
    if (!m.reply_message) return await m.sendReply("_Reply to a message!_");
    const query = t[1] || m.jid;
    const jidMap = query.split(" ").filter((x) => x.includes("@"));
    if (!jidMap.length) return await m.sendReply("_Provide a valid JID!_");

    for (const jid of jidMap) {
      await m.forwardMessage(jid, m.quoted, { contextInfo: { isForwarded: false } });
    }
    await m.sendReply(`_✅ Message sent by ${BOT_BRAND}_`);
  }
);

// 👑 Forward message
Module(
  {
    pattern: "forward ?(.*)",
    fromMe: true,
    desc: "Forward a message to a specific JID",
    use: "whatsapp",
  },
  async (m, t) => {
    if (!m.reply_message) return await m.sendReply("_Reply to a message!_");
    const query = t[1] || m.jid;
    const jidMap = query.split(" ").filter((x) => x.includes("@"));
    if (!jidMap.length) return await m.sendReply("_Provide a valid JID!_");

    for (const jid of jidMap) {
      await m.forwardMessage(jid, m.quoted, { contextInfo: { isForwarded: true, forwardingScore: 999 } });
    }
  }
);

// 👑 Retry a command
Module(
  {
    pattern: "retry ?(.*)",
    fromMe: isPrivateMode,
    desc: "Re-runs a replied command",
    use: "misc",
  },
  async (m) => {
    if (!m.reply_message) return await m.sendReply("_Reply to a command message!_");
    await m.client.ev.emit("messages.upsert", { messages: [m.quoted], type: "notify" });
  }
);

// 👑 View Once Downloader (vv)
Module(
  {
    pattern: "vv ?(.*)",
    fromMe: true,
    desc: "Download/Resend View Once messages",
    use: "utility",
  },
  async (m, match) => {
    const quoted = m.quoted?.message;
    if (!m.reply_message || !quoted) return await m.sendReply("_Not a View Once message!_");

    if (match[1] && match[1].includes("@")) m.jid = match[1];

    const viewOnceKey = ["viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension"].find((key) => quoted.hasOwnProperty(key));

    if (viewOnceKey) {
      const realMessage = quoted[viewOnceKey].message;
      const msgType = Object.keys(realMessage)[0];
      if (realMessage[msgType]?.viewOnce) realMessage[msgType].viewOnce = false;
      m.quoted.message = realMessage;
      return await m.forwardMessage(m.jid, m.quoted, { contextInfo: { isForwarded: false } });
    }

    const directType = quoted.imageMessage ? "imageMessage" : quoted.audioMessage ? "audioMessage" : quoted.videoMessage ? "videoMessage" : null;

    if (directType && quoted[directType]?.viewOnce) {
      quoted[directType].viewOnce = false;
      return await m.forwardMessage(m.jid, m.quoted, { contextInfo: { isForwarded: false } });
    }

    await m.sendReply("_Message is not View Once!_");
  }
);

// 👑 Delete Message (For Everyone)
Module(
  {
    pattern: "delete",
    fromMe: true,
    desc: "Deletes message for everyone",
    use: "whatsapp",
  },
  async (m) => {
    if (!m.reply_message) return await m.sendReply("_Reply to a message to delete it!_");
    
    let adminAccess = ADMIN_ACCESS ? await isAdmin(m, m.sender) : false;
    if (m.fromOwner || adminAccess) {
      m.jid = m.quoted.key.remoteJid;
      if (m.quoted.key.fromMe) return await m.client.sendMessage(m.jid, { delete: m.quoted.key });
      
      const admin = await isAdmin(m);
      if (!admin) return await m.sendReply("_Bot needs Admin privilege to delete others' messages!_");
      return await m.client.sendMessage(m.jid, { delete: m.quoted.key });
    }
  }
);
