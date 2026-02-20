const { Module } = require('../main');
const isPrivateMode = require('../config').MODE !== 'public';
const { fancy } = require('./utils');

Module({
     pattern: 'fancy ?(.*)',
     fromMe: isPrivateMode,
     use: 'utility',
     desc: 'Creates stylish fancy text fonts'
 }, (async (message, match) => {
     // If no input and no reply, show instructions and all styles
     if (!match[1] && !message.reply_message.message) {
         return await message.sendReply(
             '_*ZAHID-KING-MD FANCY TEXT*_ \n\n' +
             '_Reply to text with a style code or type it._ \n' +
             '_Example:_ \n' +
             '• `.fancy 10 Hello` \n' +
             '• `.fancy Hello world` \n\n' +
             '───「 Available Styles 」───\n' +
             String.fromCharCode(8206).repeat(4001) + fancy.list('Text here', fancy)
         );
     }

    const id = match[1].match(/\d+/g)?.join('');
     try {
        if (id === undefined && !message.reply_message){
            return await message.sendReply(fancy.list(match[1], fancy));
        }
        
        const textToStyle = message.reply_message.text || match[1].replace(id, '').trim();
        const styleId = parseInt(id) - 1;

        if (!fancy[styleId]) return await message.sendReply('_Invalid style code! Use .fancy to see list._');

        return await message.sendReply(fancy.apply(fancy[styleId], textToStyle));    
    } catch (e) {
        return await message.sendReply('_Error: No such style found!_');
     }
 }));
