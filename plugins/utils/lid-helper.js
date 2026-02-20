/**
 * ZAHID-KING-MD - Identity & LID Helper
 * Handles JID, LID, and Sudo user identification.
 */

// 1. Identification Checkers
function isLid(identifier) {
    return identifier && identifier.endsWith('@lid');
}

function isJid(identifier) {
    return identifier && (identifier.endsWith('@s.whatsapp.net') || identifier.endsWith('@g.us'));
}

// 2. Bot Identity Getters
function getBotJid(client) {
    if (client.user && client.user.id) {
        return client.user.id.split(":")[0] + "@s.whatsapp.net";
    }
    return null;
}

function getBotLid(client) {
    if (client.user && client.user.lid) {
        return client.user.lid.split(":")[0] + "@lid";
    }
    return null;
}

function getBotId(client) {
    return getBotLid(client) || getBotJid(client);
}

// 3. User & Numeric ID Extractors
function getNumericId(identifier) {
    if (!identifier) return null;
    if (isLid(identifier) || isJid(identifier)) {
        return identifier.split('@')[0];
    }
    return identifier;
}

function getBotNumericId(message, client) {
    let isPvt = isPrivateMessage(message.jid);
    let isLidChat = isPvt ? false : isLid(message.key?.participant);
    if (isLidChat && client.user && client.user.lid) return client.user.lid.split(":")[0];
    if (client.user && client.user.id) return client.user.id.split(":")[0];
    return null;
}

// 4. Sudo & Ownership Logic (ZAHID-KING-MD Core Security)
function isSudo(identifier, sudoConfig) {
    if (!identifier || !sudoConfig) return false;
    const userNumeric = getNumericId(identifier);
    const sudoNumbers = sudoConfig.split(",").map(s => s.trim());
    return sudoNumbers.includes(userNumeric);
}

function isFromOwner(msg, client, sudoConfig) {
    if (msg.key.fromMe) return true;
    const botNumeric = getBotNumericId(msg, client);
    const senderNumeric = getNumericId(msg.key.participant || msg.key.remoteJid);
    if (botNumeric === senderNumeric) return true;
    return isSudo(msg.key.participant || msg.key.remoteJid, sudoConfig);
}

// 5. Conversion Tools
function toLid(identifier) {
    if (!identifier) return null;
    if (isLid(identifier)) return identifier;
    if (identifier.endsWith('@g.us')) return identifier; 
    return identifier.split('@')[0] + '@lid';
}

function toJid(identifier) {
    if (!identifier) return null;
    if (isJid(identifier)) return identifier;
    if (identifier.endsWith('@g.us')) return identifier;
    return identifier.split('@')[0] + '@s.whatsapp.net';
}

function isPrivateMessage(remoteJid) {
    if (!remoteJid) return false;
    if (remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') return false;
    return remoteJid.endsWith('.net') || remoteJid.endsWith('@lid');
}

// 6. Exports for ZAHID-KING-MD
module.exports = {
    isLid,
    isJid,
    getBotId,
    getBotJid,
    getBotLid,
    getBotNumericId,
    getNumericId,
    isSudo,
    isFromOwner,
    isPrivateMessage,
    toLid,
    toJid,
    parseSudoList: (sudoConfig) => sudoConfig ? sudoConfig.split(',').map(s => getNumericId(s.trim())) : []
};
    
