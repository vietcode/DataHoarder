const { join, basename, } = require("path");
const { spawn } = require("child_process");

const Discord = require("discord.js");
const fetch = require("node-fetch");

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
    await message.reply(`Your requested download has been added to the queue.`);

    const response = await fetch(url, {
      method: "get",
      headers: {},
    });

    if (!response.ok) { // res.status >= 200 && res.status < 300
      throw Error(response.status);
    }

    const { pathname } = url;

    const args = [
      "--config",
      CONFIG,
      "rcat",
      `target:${ basename(pathname) }`,
      "--progress",
      "--stats=2s",
      "--stats-one-line",
    ]

    const rcat = spawn(RCLONE, args,);

    rcat.stderr.on("data", (data) => {
      console.log(`stderr: ${data}`);
    });

    rcat.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    response.body.pipe(rcat.stdin);
	},
};
