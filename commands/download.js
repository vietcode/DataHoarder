const { basename, extname, join } = require("path");

const debug = require("debug")("hoarder:download");
const Discord = require("discord.js");
const fetch = require("node-fetch");

const { bytes, progress, rcat } = require("../utils.js");

const {
  RCLONE_CONFIG_TARGET_TEAM_DRIVE,
  RCLONE_CONFIG_TARGET_ROOT_FOLDER_ID,
} = process.env;

const folder = RCLONE_CONFIG_TARGET_ROOT_FOLDER_ID || RCLONE_CONFIG_TARGET_TEAM_DRIVE;

module.exports = {
  name: "download",
  aliases: [],
  description: "Downloads a file at an URL to a Google Drive location",
  guildOnly: true,
  params: [
    {
      name: "url",
      type: "url",
    },
    {
      name: "destpath",
      type: "text",
    },
  ],
  usage: "<url> [destpath]",
  /**
   * Downloads a link to a Google Drive folder
   * @param {Discord.Message} message - The incoming chat message.
   * @param {URL} url The URL to download
   * @param {string} [destpath] Path to Google Drive to save file to.
   */
	async execute(message, url, destpath = basename(url.pathname)) {
    let remote = "target";

    // If `destpath` is a folder, append the filename from URL.
    if (!extname(destpath)) {
      destpath = join(destpath, basename(url.pathname));
    }

    destpath = decodeURIComponent(destpath);

    debug(`download ${ url } ${ destpath }`);

    let header = `**File**: ${ destpath }`;

    const reply = await message.reply(`${ header }\n**Status**: Pending`);

    const response = await fetch(url, {
      method: "get",
      headers: {},
    });

    if (!response.ok) { // res.status >= 200 && res.status < 300
      throw Error(response.status);
    }

    const fileSize = Number(response.headers.get("content-length"));

    if (fileSize) {
      header += ` (${ bytes(fileSize) })`;
    }

    reply.edit(`${ header }\n**Status**: Downloading...`);

    progress(response.body, {
      delay: 1000,
      total: fileSize,
    }).on("progress", ({ doneh, rateh, etaDate }) => {
      reply.edit(`${ header }\n**Status**: ${ doneh } @ ${ rateh }/s. ETA: ${ etaDate.toLocaleString() }.`);
    });

    response.body.on("end", () => {
      reply.edit(`${ header }\n**Status**: Finishing last bytes...`);
    });

    const fileId = await rcat(response.body, `${ remote }:${ destpath }`);
    reply.edit(`${ header }\nhttps://drive.google.com/file/d/${ fileId }`);

    return reply;
	},
};
