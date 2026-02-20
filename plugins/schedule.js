const { Module } = require("../main");
const { scheduledMessages } = require("./utils/db/schedulers");
const moment = require("moment");
let config = require("../config");

const BOT_BRAND = "ZAHID-KING-MD";

function isValidJID(text) {
  return (
    text.endsWith("@g.us") ||
    text.endsWith("@s.whatsapp.net") ||
    text.endsWith("@lid")
  );
}

function parseTime(timeStr) {
  const now = moment();
  const durationMatch =
    timeStr.match(/^(\d+)([dhms])$/i) ||
    timeStr.match(/^(\d+)h(\d+)m$/i) ||
    timeStr.match(/^(\d+)m(\d+)s$/i);
  if (durationMatch) {
    let duration = moment.duration();
    if (timeStr.includes("h") && timeStr.includes("m")) {
      const [, hours, minutes] = timeStr.match(/^(\d+)h(\d+)m$/i);
      duration.add(parseInt(hours), "hours").add(parseInt(minutes), "minutes");
    } else if (timeStr.includes("m") && timeStr.includes("s")) {
      const [, minutes, seconds] = timeStr.match(/^(\d+)m(\d+)s$/i);
      duration
        .add(parseInt(minutes), "minutes")
        .add(parseInt(seconds), "seconds");
    } else {
      const [, value, unit] = durationMatch;
      const unitMap = { d: "days", h: "hours", m: "minutes", s: "seconds" };
      duration.add(parseInt(value), unitMap[unit.toLowerCase()]);
    }
    return now.add(duration).subtract(1, "minute").toDate();
  }
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(\s*[ap]m)?$/i);
  if (timeMatch) {
    let [, hours, minutes, period] = timeMatch;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    if (period) {
      period = period.trim().toLowerCase();
      if (period === "pm" && hours !== 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;
    }
    const targetTime = moment().hours(hours).minutes(minutes).seconds(0);
    if (targetTime.isBefore(now)) {
      targetTime.add(1, "day");
    }
    return targetTime.subtract(1, "minute").toDate();
  }
  const dateTime = moment(timeStr, [
    "YYYY-MM-DD HH:mm",
    "DD/MM/YYYY HH:mm",
    "MM/DD/YYYY HH:mm",
  ]);
  if (dateTime.isValid()) {
    return dateTime.subtract(1, "minute").toDate();
  }
  return null;
}

async function createMessageObject(replyMessage) {
  let messageObj = {};
  if (replyMessage.text) messageObj.text = replyMessage.text;
  
  const mediaTypes = ["image", "video", "audio", "document", "sticker"];
  for (const type of mediaTypes) {
    if (replyMessage[type]) {
      const buffer = await replyMessage.download("buffer");
      messageObj[type] = buffer.toString("base64");
      messageObj._mediaType = type;
      if (replyMessage.caption) messageObj.caption = replyMessage.caption;
      if (type === "audio") {
        messageObj.mimetype = replyMessage.mimetype || "audio/mp4";
        if (replyMessage.ptt) messageObj.ptt = true;
      }
      if (type === "video" && replyMessage.gifPlayback) messageObj.gifPlayback = true;
      if (type === "document") {
        messageObj.fileName = replyMessage.fileName || "document";
        messageObj.mimetype = replyMessage.mimetype;
      }
      break;
    }
  }
  return JSON.stringify(messageObj);
}

// 👑 Command: Schedule Message
Module(
  {
    pattern: "schedule ?(.*)",
    use: "utility",
    desc: "Schedule a message to be sent later",
  },
  async (m, match) => {
    if (match[1] === "d") return;
    if (!m.reply_message) {
      return await m.sendReply(
        `*───「 ${BOT_BRAND} 」───*\n\n` +
        `_Reply to a message to schedule it._\n\n` +
        `*Usage:* .schedule <jid> <time>\n` +
        `*Time Examples:* 1h, 30m, 1d, 14:30, 2:45pm`
      );
    }
    
    const args = match[1]?.trim().split(/\s+/);
    if (!args || args.length < 2) return await m.sendReply("_Provide both JID and time!_");

    let jid, timeStr;
    const jidArg = args.find(arg => isValidJID(arg));
    if (jidArg) {
      jid = jidArg;
      timeStr = args.filter(arg => arg !== jidArg).join(" ");
    } else {
      return await m.sendReply("_Invalid JID format! (e.g., @g.us or @s.whatsapp.net)_");
    }

    const scheduleTime = parseTime(timeStr);
    if (!scheduleTime) return await message.sendReply("_Invalid time format! Use 2h, 10m, or HH:mm._");

    const originalTime = moment(scheduleTime).add(1, "minute").toDate();
    if (originalTime <= new Date()) return await m.sendReply("_Time must be in the future!_");

    try {
      const messageData = await createMessageObject(m.reply_message);
      await scheduledMessages.add(jid, messageData, scheduleTime);
      
      const timeFromNow = moment(scheduleTime).add(1, "minute").fromNow();
      await m.sendReply(
        `✅ *Message Scheduled!*\n\n` +
        `📅 *Date:* ${moment(scheduleTime).add(1, "minute").format("DD/MM/YYYY HH:mm")}\n` +
        `⏰ *Starts:* ${timeFromNow}\n` +
        `📱 *To:* ${jid}`
      );
    } catch (error) {
      await m.sendReply("_Failed to schedule message._");
    }
  }
);

// 👑 Command: List Scheduled Messages
Module(
  {
    pattern: "scheduled ?(.*)",
    use: "utility",
    desc: "List pending schedules",
  },
  async (m) => {
    try {
      const pending = await scheduledMessages.getAllPending();
      if (pending.length === 0) return await m.sendReply("_No pending messages scheduled._");

      let response = `*───「 ${BOT_BRAND} SCHEDULES 」───*\n\n`;
      pending.sort((a, b) => a.scheduleTime - b.scheduleTime).forEach((msg, i) => {
        const timeStr = moment(msg.scheduleTime).add(1, "minute").format("HH:mm (DD/MM)");
        response += `*${i + 1}. ID:* \`${msg.id}\`\n   *To:* ${msg.jid.split("@")[0]}\n   *At:* ${timeStr}\n\n`;
      });
      response += `_Use ".cancel <id>" to remove._`;
      await m.sendReply(response);
    } catch (e) {
      await m.sendReply("_Error fetching list._");
    }
  }
);

// 👑 Command: Cancel Schedule
Module(
  {
    pattern: "cancel ?(.*)",
    use: "utility",
    desc: "Cancel a scheduled message by ID",
  },
  async (m, match) => {
    if (!match[1]) return await m.sendReply("_Provide a message ID! Usage: .cancel 5_");
    const id = parseInt(match[1]);
    try {
      const success = await scheduledMessages.delete(id);
      return await m.sendReply(success ? `_✅ Schedule ID ${id} cancelled._` : "_❌ ID not found._");
    } catch (e) {
      await m.sendReply("_Error cancelling message._");
    }
  }
);
