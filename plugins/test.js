const { Module } = require("../main");

const BOT_BRAND = "ZAHID-KING-MD";

// 🕒 Helper function to format time
function TimeCalculator(seconds) {
  let y = Math.floor(seconds / 31536000),
    mo = Math.floor((seconds % 31536000) / 2628000),
    d = Math.floor(((seconds % 31536000) % 2628000) / 86400),
    h = Math.floor((seconds % 86400) / 3600),
    m = Math.floor((seconds % 3600) / 60),
    s = Math.floor(seconds % 60);

  return (
    (y > 0 ? y + (y === 1 ? " year, " : " years, ") : "") +
    (mo > 0 ? mo + (mo === 1 ? " month, " : " months, ") : "") +
    (d > 0 ? d + (d === 1 ? " day, " : " days, ") : "") +
    (h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "") +
    (m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "") +
    (s > 0 ? s + (s === 1 ? " second" : " seconds") : "")
  );
}

// 👑 Command: Age Calculator
Module(
  {
    pattern: "age ?(.*)",
    desc: "Calculates age from Date of Birth (DD-MM-YYYY)",
    use: "utility",
  },
  async (m, match) => {
    if (!match[1]) return await m.sendReply("_Please provide your Date of Birth (e.g., 25/12/1998)_");
    
    if (!/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/.test(match[1])) {
      return await m.sendReply("_Format must be DD/MM/YYYY!_");
    }

    let DOB = match[1];
    let parts = DOB.includes("-") ? DOB.split("-") : DOB.split("/");
    let actual = parts[1] + "-" + parts[0] + "-" + parts[2]; // Converts to MM-DD-YYYY for JS Date
    
    let dob = new Date(actual).getTime();
    let today = new Date().getTime();
    
    if (dob > today) return await m.sendReply("_Date of Birth cannot be in the future!_");

    let ageInSeconds = (today - dob) / 1000;
    return await m.sendReply(`*───「 ${BOT_BRAND} AGE 」───*\n\n` + "```" + TimeCalculator(ageInSeconds) + "```");
  }
);

// 👑 Command: Date Countdown
Module(
  {
    pattern: "cntd ?(.*)",
    desc: "Counts remaining time until a future date",
    use: "utility",
  },
  async (m, match) => {
    if (!match[1]) return await m.sendReply("_Provide a future date! (e.g., 01/01/2027)_");

    if (!/^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/.test(match[1])) {
      return await m.sendReply("_Format must be DD/MM/YYYY!_");
    }

    let targetDate = match[1];
    let parts = targetDate.includes("-") ? targetDate.split("-") : targetDate.split("/");
    let actual = parts[1] + "-" + parts[0] + "-" + parts[2];
    
    let targetTime = new Date(actual).getTime();
    let now = new Date().getTime();
    
    if (targetTime < now) return await m.sendReply("_Date must be in the future!_");

    let remainingSeconds = (targetTime - now) / 1000;
    return await m.sendReply(`*───「 ${BOT_BRAND} COUNTDOWN 」───*\n\n` + `_Remaining:_ *${TimeCalculator(remainingSeconds)}*`);
  }
);

// 👑 Command: Speed Test (Ping)
Module(
  {
    pattern: "ping",
    use: "utility",
    desc: "Measures bot response latency",
  },
  async (message) => {
    const start = process.hrtime();
    let sent_msg = await message.sendReply(`*Testing ${BOT_BRAND} Latency...*`);
    const diff = process.hrtime(start);
    const ms = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(2);
    
    await message.edit(`*🚀 Latency:* \`${ms} ms\``, message.jid, sent_msg.key);
  }
);
