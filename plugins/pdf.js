const { Module } = require("../main");
const { convert: imageToPdf, sizes } = require("image-to-pdf");
const fileSystem = require("node:fs/promises");
const fileType = require("file-type");
const { MODE } = require("../config");
const path = require("path");
const fs = require("fs");
const { getTempSubdir, getTempPath } = require("../core/helpers");

const BOT_BRAND = "ZAHID-KING-MD";

const getFileType = async (buffer) => {
  try {
    if (fileType.fileTypeFromBuffer) return await fileType.fileTypeFromBuffer(buffer);
    if (fileType.fromBuffer) return await fileType.fromBuffer(buffer);
    return await fileType(buffer);
  } catch (error) {
    return null;
  }
};

const imageInputDirectory = getTempSubdir("pdf");
const finalPdfOutputPath = getTempPath("converted.pdf");

Module(
  {
    pattern: "pdf ?(.*)",
    fromMe: MODE === "private",
    desc: "Convert multiple images into a single PDF file",
    use: "converters",
    usage: ".pdf help",
  },
  async (message, commandArguments) => {
    const subCommand = commandArguments[1]?.toLowerCase();

    // 👑 Help Menu
    if (subCommand === "help") {
      return await message.sendReply(
        `*───「 PDF CONVERTER 」───*\n\n` +
        `1. Reply to an image with \`.pdf\` to add it.\n` +
        `2. Use \`.pdf get\` to generate the final PDF.\n` +
        `3. Use \`.pdf delete\` to clear added images.\n\n` +
        `_Files are auto-deleted after conversion._`
      );
    } 
    
    // 👑 Clear Cache
    else if (subCommand === "delete") {
      const currentFiles = await fileSystem.readdir(imageInputDirectory);
      await Promise.all(currentFiles.map(file => fileSystem.unlink(path.join(imageInputDirectory, file))));
      try { await fileSystem.unlink(finalPdfOutputPath); } catch (e) {}
      return await message.sendReply(`_✅ All cached images cleared successfully!_`);
    } 
    
    // 👑 Generate PDF
    else if (subCommand === "get") {
      const allStoredFiles = await fileSystem.readdir(imageInputDirectory);
      const imageFilePaths = allStoredFiles
        .filter((fileName) => fileName.includes("topdf"))
        .map((fileName) => path.join(imageInputDirectory, fileName));

      if (!imageFilePaths.length) return await message.sendReply("_No images found in queue!_");

      await message.send(`_Generating PDF from ${imageFilePaths.length} images..._`);
      
      const pdfGenerationStream = imageToPdf(imageFilePaths, sizes.A4);
      const pdfWriteStream = fs.createWriteStream(finalPdfOutputPath);
      pdfGenerationStream.pipe(pdfWriteStream);

      pdfWriteStream.on("finish", async () => {
        await message.client.sendMessage(
          message.jid,
          {
            document: { url: finalPdfOutputPath },
            mimetype: "application/pdf",
            fileName: `${BOT_BRAND}_Converted.pdf`,
          },
          { quoted: message.data }
        );

        // Cleanup
        const filesToCleanUp = await fileSystem.readdir(imageInputDirectory);
        await Promise.all(filesToCleanUp.map(file => fileSystem.unlink(path.join(imageInputDirectory, file))));
        await fileSystem.unlink(finalPdfOutputPath);
      });

      pdfWriteStream.on("error", async (error) => {
        await message.sendReply(`_Error: ${error.message}_`);
      });
    } 
    
    // 👑 Handle Single Image / Album
    else if (message.reply_message) {
      const reply = message.reply_message;
      
      // Handle Multi-Images (Albums)
      if (reply.album) {
        const albumData = await reply.download();
        const allImages = albumData.images || [];
        if (allImages.length === 0) return await message.sendReply("_No images found in album!_");

        for (let i = 0; i < allImages.length; i++) {
          const file = allImages[i];
          const type = await getFileType(fs.readFileSync(file));
          if (type && type.mime.startsWith("image")) {
            fs.copyFileSync(file, path.join(imageInputDirectory, `topdf_album_${Date.now()}_${i}.jpg`));
          }
        }
        return await message.sendReply(`_✅ Added ${allImages.length} images. Total images ready. Use \`.pdf get\` to finish._`);
      }

      // Handle Single Image
      const buffer = await reply.download("buffer");
      const type = await getFileType(buffer);

      if (type && type.mime.startsWith("image")) {
        const existingCount = (await fileSystem.readdir(imageInputDirectory)).filter(f => f.includes("topdf")).length;
        const newPath = path.join(imageInputDirectory, `topdf_${existingCount}.jpg`);
        await fileSystem.writeFile(newPath, buffer);
        return await message.sendReply(`_✅ Image added! (Total: ${existingCount + 1})_\n_Use \`.pdf get\` when done._`);
      } else {
        return await message.sendReply("_Please reply to an image!_");
      }
    } else {
      return await message.sendReply(`_Reply to an image or use \`.pdf help\`_`);
    }
  }
);
