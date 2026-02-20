const { isAdmin, mentionjid } = require("./utils");
const { ADMIN_ACCESS } = require("../config");
const { Module } = require("../main");
const {
  fetchFromStore,
  getTopUsers,
  getGlobalTopUsers,
} = require("../core/store");

const BOT_BRAND = "ZAHID-KING-MD";

// Time formatter
function timeSince(date) {
  if (!date) return "Never";
  var seconds = Math.floor((new Date() - new Date(date)) / 1000);
  var interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

function parseDuration(duration) {
  const regex = /^(\d+)([dwmy])$/i;
  const match = duration.match(regex);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const now = new Date();
  switch (unit) {
    case "d": return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
    case "w": return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
    case "m": return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
    case "y": return new Date(now.getTime() - value * 365 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

// 👑 Command: Get Message Stats
Module(
  {
    pattern: "msgs ?(.*)",
    fromMe: true,
    desc: "Shows message count of group members",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_This command is for groups only!_");

    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (message.fromOwner || adminAccess) {
      var users = (await message.client.groupMetadata(message.jid)).participants.map((e) => e.id);
      if (message.mention?.[0]) users = message.mention;
      if (message.reply_message && !message.mention.length) users = [message.reply_message?.jid];

      let userStats = await fetchFromStore(message.jid);
      let usersWithMessages = [];
      for (let user of users) {
        let userStat = userStats.find((stat) => stat.userJid === user);
        if (userStat && userStat.totalMessages > 0) {
          usersWithMessages.push({ jid: user, stat: userStat });
        }
      }

      usersWithMessages.sort((a, b) => b.stat.totalMessages - a.stat.totalMessages);
      if (usersWithMessages.length === 0) return await message.sendReply("_No data found for these members._");

      let final_msg = `*───「 ${BOT_BRAND} STATS 」───*\n\n`;
      for (let userObj of usersWithMessages) {
        let user = userObj.jid;
        let userStat = userObj.stat;
        final_msg += `*User:* @${user.split("@")[0]}\n`;
        final_msg += `*Total:* ${userStat.totalMessages}\n`;
        final_msg += `*Last:* ${timeSince(userStat.lastMessageAt)}\n\n`;
      }
      return await message.client.sendMessage(message.jid, { text: final_msg, mentions: users });
    }
  }
);

// 👑 Command: Inactive Members Manager
Module(
  {
    pattern: "inactive ?(.*)",
    fromMe: true,
    desc: "Show or kick inactive members",
    use: "group",
  },
  async (message, match) => {
    if (!message.isGroup) return await message.sendReply("_Groups only!_");

    let adminAccess = ADMIN_ACCESS ? await isAdmin(message, message.sender) : false;
    if (message.fromOwner || adminAccess) {
      if (!match[1]) return await message.sendReply("_Usage: .inactive 30d | .inactive 10d kick_");

      const args = match[1].trim().split(" ");
      const durationStr = args[0];
      const shouldKick = args[1]?.toLowerCase() === "kick";
      const cutoffDate = parseDuration(durationStr);

      if (!cutoffDate) return await message.sendReply("_Invalid format! Example: 30d, 2w, 1m_");

      const groupMetadata = await message.client.groupMetadata(message.jid);
      const userStats = await fetchFromStore(message.jid);
      let inactiveMembers = [];

      for (let user of groupMetadata.participants.map(e => e.id)) {
        let userStat = userStats.find(stat => stat.userJid === user);
        if (!userStat || !userStat.lastMessageAt || new Date(userStat.lastMessageAt) < cutoffDate) {
          inactiveMembers.push({ jid: user, last: userStat?.lastMessageAt ? timeSince(userStat.lastMessageAt) : "Never" });
        }
      }

      if (shouldKick) {
        if (!(await isAdmin(message))) return await message.sendReply("_Bot needs admin to kick!_");
        inactiveMembers = inactiveMembers.filter(m => !groupMetadata.participants.find(p => p.id === m.jid).admin);
        
        await message.send(`_❗ Kicking ${inactiveMembers.length} members in 5 seconds..._`);
        await new Promise(r => setTimeout(r, 5000));
        for (let member of inactiveMembers) {
          await message.client.groupParticipantsUpdate(message.jid, [member.jid], "remove");
          await new Promise(r => setTimeout(r, 2000)); // Delay to avoid ban
        }
        return await message.send("_✅ Process completed!_");
      } else {
        let list = `*─── INACTIVE MEMBERS (${durationStr}) ───*\n\n`;
        inactiveMembers.forEach((m, i) => list += `${i+1}. @${m.jid.split("@")[0]} (${m.last})\n`);
        return await message.client.sendMessage(message.jid, { text: list, mentions: inactiveMembers.map(m => m.jid) });
      }
    }
  }
);

// 👑 Command: Top Users
Module(
  {
    pattern: "users ?(.*)",
    fromMe: true,
    desc: "Shows leaderboard of active users",
  },
  async (message, match) => {
    let isGlobal = match[1]?.includes("global") || !message.isGroup;
    let limit = 10;
    
    let topUsers = isGlobal ? await getGlobalTopUsers(limit) : await getTopUsers(message.jid, limit);
    if (topUsers.length === 0) return await message.sendReply("_No data found!_");

    let response = `*───「 ${isGlobal ? 'GLOBAL' : 'GROUP'} TOP ${topUsers.length} 」───*\n\n`;
    topUsers.forEach((u, i) => {
      response += `*${i+1}.* @${u.jid.split("@")[0]}\n   _Messages: ${u.totalMessages}_\n\n`;
    });

    return await message.client.sendMessage(message.jid, { text: response, mentions: topUsers.map(u => u.jid) });
  }
);
            
