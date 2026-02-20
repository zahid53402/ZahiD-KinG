const { Module } = require("../main");
const config = require("../config");
const axios = require("axios");
const fromMe = config.MODE !== "public";
const { setVar } = require("./manage");
const fs = require("fs");

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const models = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
];
const chatbotStates = new Map();
const chatContexts = new Map();
const modelStates = new Map();

// 👑 ZAHID-KING: System Identity
let globalSystemPrompt =
  "You are ZAHID-KING-MD, a powerful and smart AI assistant created by Zahid King. Always provide helpful and professional responses in English.";

async function initChatbotData() {
  try {
    const chatbotData = config.CHATBOT || "";
    if (chatbotData) {
      const enabledChats = chatbotData.split(",").filter((jid) => jid.trim());
      enabledChats.forEach((jid) => {
        chatbotStates.set(jid.trim(), true);
        modelStates.set(jid.trim(), 0);
      });
    }
    const systemPrompt = config.CHATBOT_SYSTEM_PROMPT;
    if (systemPrompt) globalSystemPrompt = systemPrompt;
  } catch (error) {
    console.error("Error initializing chatbot data:", error);
  }
}

initChatbotData();

async function getAIResponse(message, chatJid, imageBuffer = null) {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) return "_❌ GEMINI_API_KEY not found. Please set it using .setvar GEMINI_API_KEY:your_key_";

  const currentModelIndex = modelStates.get(chatJid) || 0;
  const currentModel = models[currentModelIndex];

  try {
    const apiUrl = `${API_BASE_URL}${currentModel}:generateContent?key=${apiKey}`;
    const contents = [{ role: "user", parts: [{ text: `System: ${globalSystemPrompt}` }] }];
    
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await axios.post(apiUrl, { contents }, { timeout: 15000 });
    const aiResponse = response.data.candidates[0].content.parts[0].text;
    return aiResponse;
  } catch (error) {
    return "_❌ AI Error: Could not generate response. Please try again later._";
  }
}

Module(
  {
    pattern: "chatbot ?(.*)",
    fromMe: true,
    desc: "ZAHID-KING AI Chatbot Settings",
  },
  async (message, match) => {
    const input = match[1]?.trim();
    if (!input) {
      return await message.sendReply(
        `*👑 ZAHID-KING-MD AI CHATBOT*\n\n` +
        `🤖 _Status:_ \`${chatbotStates.get(message.jid) ? "ENABLED" : "DISABLED"}\`\n` +
        `📝 _System:_ \`ZAHID-KING-MD AI\`\n\n` +
        `*Commands:*\n` +
        `- \`.chatbot on\` (Enable AI)\n` +
        `- \`.chatbot off\` (Disable AI)\n` +
        `- \`.chatbot clear\` (Reset Chat)`
      );
    }

    if (input === "on") {
        chatbotStates.set(message.jid, true);
        return await message.sendReply("*✅ ZAHID-KING AI is now ENABLED in this chat!*");
    }
    if (input === "off") {
        chatbotStates.set(message.jid, false);
        return await message.sendReply("*❌ ZAHID-KING AI has been DISABLED.*");
    }
    if (input === "clear") {
        chatContexts.delete(message.jid);
        return await message.sendReply("*✅ AI memory has been cleared for this chat.*");
    }
  }
);

Module(
  {
    pattern: "ai ?(.*)",
    fromMe,
    desc: "Ask ZAHID-KING AI anything",
    type: "ai",
  },
  async (message, match) => {
    const prompt = match[1]?.trim();
    if (!prompt) return await message.sendReply("*Please provide a query!*");
    await message.react("🧠");
    const res = await getAIResponse(prompt, message.jid);
    await message.sendReply(res);
  }
);
        
