const { join, basename, } = require("path");
const { spawn } = require("child_process");

const Discord = require("discord.js");
const fetch = require("node-fetch");
const { throttle } = require("throttle-debounce");

const CWD = process.cwd();
const RCLONE = join(CWD, "bin", "rclone");
const CONFIG = join(CWD, "bin", "rclone.conf");

module.exports = {
  name: "download",
  aliases: [],
  description: "Downloads a file at an URL to a Google Drive folder",
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
    const { pathname } = url;
    const filename = decodeURIComponent(basename(pathname));

    const reply = await message.reply(`**Filename**: ${ filename }\n**Status**: Pending`);

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

    reply.edit(`**Filename**: ${ filename }\n**Status**: ${ progress(done, total)}`);

    // Throttle the progress update.
    const throttled = throttle(
      250,
      () => {
        reply.edit(`**Filename**: ${ filename }\n**Status**: ${ progress(done, total)}`);
      },
    );

    // Update progress.
    response.body.on("data", (chunk) => {
      done += chunk.length;
      return throttled();
    });

    response.body.on("end", (chunk) => {
      reply.edit(`**Filename**: ${ filename }\n**Status**: Finishing last bytes...`);
    });

    const args = [
      "--config",
      CONFIG,
      "rcat",
      `target:${ filename }`,
    ]

    const rcat = spawn(RCLONE, args,);

    rcat.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    rcat.stdout.on("end", () => {
      reply.edit(`**Filename**: ${ filename }\n**Status**: Uploaded.`);
    });

    response.body.pipe(rcat.stdin);
	},
};

function progress(done, total) {
  return `Downloading ${ formatBytes(done) } of ${ formatBytes(total) }`;
}

/**
 * Formats bytes into human-readable units.
 * @param {number} bytes The number of bytes
 * @param {number} [decimals=2] Number of decimal points
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
