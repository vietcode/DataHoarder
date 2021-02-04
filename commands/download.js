const { basename } = require("path");

const Discord = require("discord.js");
const fetch = require("node-fetch");

const rclone = require("../bin/rclone.js");
const { bytes, progress } = require("../utils.js");

module.exports = {
  name: "download",
  aliases: [],
  description: "Downloads a file at an URL to a Google Drive folder",
  guildOnly: true,
  params: [
    {
      name: "url",
      type: "url",
    },
  ],
  usage: "<url>",
  /**
   * Downloads a link to a Google Drive folder
   * @param {Discord.Message} message - The incoming chat message.
   * @param {URL} url The URL to download
   */
	async execute(message, url) {
    message.suppressEmbeds(true);

    const { pathname } = url;
    const filename = decodeURIComponent(basename(pathname));

    let header = `**File**: ${ filename }`;

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

    const rcat = rclone.rcat(`target:${ filename }`);

    rcat.stderr.on("data", (data) => {
      console.log(`stderr: ${ data }`);
    });

    rcat.stdout.on("end", () => {
      reply.edit(`${ header }\n**Status**: Uploaded.`);
    });

    response.body.pipe(rcat.stdin);
	},
};
