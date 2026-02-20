/**
 * ZAHID-KING-MD Fancy Font Module
 * Provides 30+ stylish fonts for your WhatsApp Bot
 */

function apply(map, text) {
    let result = ""; 
    for (let character of text.split("")) { 
        if (map[character] !== undefined) result += map[character]; 
        else if (map[character.toLowerCase()] !== undefined) result += map[character.toLowerCase()]; 
        else result += character 
    }
    return result;
}

function list(text, fancy) {
    let styles = (Object.keys(fancy)).filter(e => e.length < 3)
    let msg = `*───「 ${"ZAHID-KING-MD".toUpperCase()} FONTS 」───*\n\n`
    msg += `_Input Text:_ ${text}\n\n`
    
    for (let style in styles) {
        let index = parseInt(style);
        if (index === 33) {
            msg += `\`${index + 1}.\` Malayalam Font\n`
        } else {
            msg += `\`${index + 1}.\` ${fancy.apply(fancy[index], text)}\n`
        }
    }
    msg += `\n*Example:* \`.fancy 5 Hello\``;
    return msg;
} 

module.exports = {
    // Fonts Data Starts Here
    0:{"0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","a":"ค","b":"๖","c":"¢","d":"໓","e":"ē","f":"f","g":"ງ","h":"h","i":"i","j":"ว","k":"k","l":"l","m":"๓","n":"ຖ","o":"໐","p":"p","q":"๑","r":"r","s":"Ş","t":"t","u":"น","v":"ง","w":"ຟ","x":"x","y":"ฯ","z":"ຊ","A":"ค","B":"๖","C":"¢","D":"໓","E":"ē","F":"f","G":"ງ","H":"h","I":"i","J":"ว","K":"k","L":"l","M":"๓","N":"ຖ","O":"໐","P":"p","Q":"๑","R":"r","S":"Ş","T":"t","U":"น","V":"ง","W":"ຟ","X":"x","Y":"ฯ","Z":"ຊ" },
    1:{"0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","a":"ą","b":"ც","c":"ƈ","d":"ɖ","e":"ɛ","f":"ʄ","g":"ɠ","h":"ɧ","i":"ı","j":"ʝ","k":"ƙ","l":"Ɩ","m":"ɱ","n":"ŋ","o":"ơ","p":"℘","q":"զ","r":"ཞ","s":"ʂ","t":"ɬ","u":"ų","v":"۷","w":"ῳ","x":"ҳ","y":"ყ","z":"ʑ","A":"ą","B":"ც","C":"ƈ","D":"ɖ","E":"ɛ","F":"ʄ","G":"ɠ","H":"ɧ","I":"ı","J":"ʝ","K":"ƙ","L":"Ɩ","M":"ɱ","N":"ŋ","O":"ơ","P":"℘","Q":"զ","R":"ཞ","S":"ʂ","T":"ɬ","U":"ų","V":"۷","W":"ῳ","X":"ҳ","Y":"ყ","Z":"ʑ" },
    // ... (Your other 30+ fonts data remains the same)
    33:{"ഒ":"ඉ","എ":"ᬤ","ഉ":"ຂ","ക":"ᤌ‌","ഗ":"ꪭ","ത":"ꫧ","ന":"ღ͢","മ്പ":"൩","വ":"൨","യ":"ᨨ͓","ര":"ᰍ","ി":"᭄","ീ":"ꪻ","ാ":"ꫂ","(":"ꪶ","ു":"⫰","‌്":"᷃","്":"ັ","ർ":"൪","ണ":"𑇥̅","ٹ":"ฮ","ٹٹ":"ჴ","ٹ":"൭͛","م":"◕","ٹ":"ൡ̅","ٹ":"ල","ٹ":"ᰢ","ٹ":"ꢳ"},
    apply,
    list
}
