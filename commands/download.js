const { basename } = require("path");

const Discord = require("discord.js");
const fetch = require("node-fetch");
const { throttle } = require("throttle-debounce");

const rclone = require("../bin/rclone.js");

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

    const startedAt = Date.now();
    const total = Number(response.headers.get("content-length"));
    let done = 0;

    if (total) {
      header += ` (${ bytes(total) })`;
    }

    reply.edit(`${ header }\n**Status**: ${ bytes(done) }`);

    // Throttle the progress update.
    const throttled = throttle(
      250,
      () => {
        const now = new Date();
        const elapsed = (now - startedAt) / 1000;
        const rate = done / elapsed;
        const estimated = total / rate;
        const eta = estimated - elapsed;
        now.setSeconds(now.getSeconds() + eta);
        reply.edit(`${ header }\n**Status**: ${ bytes(done) } @ ${bytes(rate)}/s. ETA: ${ now.toLocaleString() }.`);
      },
    );

    // Update progress.
    response.body.on("data", (chunk) => {
      done += chunk.length;
      return throttled();
    });

    response.body.on("end", (chunk) => {
      reply.edit(`${ header }\n**Status**: Finishing last bytes...`);
    });

    const rcat = rclone.rcat(`target:${ filename }`);

    rcat.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    rcat.stdout.on("end", () => {
      reply.edit(`${ header }\n**Status**: Uploaded.`);
    });

    response.body.pipe(rcat.stdin);
	},
};

/**
 * Formats bytes into human-readable units.
 * @param {number} bytes The number of bytes
 * @param {number} [decimals=2] Number of decimal points
 */
function bytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
