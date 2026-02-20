/**
 * ZAHID-KING-MD - Welcome & Goodbye Parser
 * Handles dynamic greetings with user images and group info.
 */

const { getBuffer } = require("./misc");

async function parseWelcomeMessage(template, messageObject, participants = []) {
  if (!template || !messageObject) return null;
  
  try {
    const groupMetadata = await messageObject.client.groupMetadata(messageObject.jid);
    const participantCount = groupMetadata.participants.length;
    const participant = participants[0]?.id;
    
    let participantNumber = participant ? participant.split("@")[0] : "";
    
    // 1. Text Placeholders Replacement
    let parsedMessage = template
      .replace(/\$mention/g, `@${participantNumber}`)
      .replace(/\$user/g, participantNumber)
      .replace(/\$group/g, groupMetadata.subject || "Group")
      .replace(/\$desc/g, groupMetadata.desc || "No Bio")
      .replace(/\$count/g, participantCount.toString())
      .replace(/\$date/g, new Date().toLocaleDateString())
      .replace(/\$time/g, new Date().toLocaleTimeString());

    let profilePicBuffer = null;

    // 2. Profile Picture Logic ($pp)
    if (template.includes("$pp") && participant) {
      try {
        const ppUrl = await messageObject.client.profilePictureUrl(participant, "image");
        if (ppUrl) profilePicBuffer = await getBuffer(ppUrl);
      } catch {
        // Fallback to Group Picture if User PP is private/hidden
        try {
          const gppUrl = await messageObject.client.profilePictureUrl(messageObject.jid, "image");
          if (gppUrl) profilePicBuffer = await getBuffer(gppUrl);
        } catch (e) { console.log("No picture available for welcome."); }
      }
      parsedMessage = parsedMessage.replace(/\$pp/g, "").trim();
    }

    return {
      text: parsedMessage,
      mentions: participant ? [participant] : [],
      image: profilePicBuffer
    };
  } catch (error) {
    console.error("Welcome Parser Error:", error);
    return null;
  }
}

async function sendWelcomeMessage(messageObject, parsed) {
  if (!parsed) return;
  try {
    if (parsed.image) {
      await messageObject.client.sendMessage(messageObject.jid, {
        image: parsed.image,
        caption: parsed.text,
        mentions: parsed.mentions
      });
    } else {
      await messageObject.client.sendMessage(messageObject.jid, {
        text: parsed.text,
        mentions: parsed.mentions
      });
    }
  } catch (e) { console.error("Send Welcome Error:", e); }
}

module.exports = { parseWelcomeMessage, sendWelcomeMessage };
