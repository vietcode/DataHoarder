const debug = require("debug")("hoarder:rclone");
const Discord = require("discord.js");

const rclone = require("../bin/rclone.js");

const COMMANDS = [
  "about",
  "check",
  "cryptcheck",
  "cryptdecode",
  "hashsum",
  "ls",
  "lsd",
  "lsf",
  "lsjson",
  "lsl",
  "md5sum",
  "sha1sum",
  "size",
  "tree",
  "version",
];

module.exports = {
  name: "rclone",
  aliases: [],
  description: "Executes rclone commands",
  params: [
    {
      name: "command",
      type: "text",
    },
  ],
  usage: "<command> [arg...]",
  /**
   * Executes rclone commands
   * @param {Discord.Message} message - The incoming chat message.
   * @param {string} command the command to execute.
   */
	async execute(message, command, ...args) {
    // Only support a few commands over chat.
    if (COMMANDS.indexOf(command) === -1) {
      message.reply("Can't execute that command.");
      return;
    }

    return new Promise((resolve, reject) => {
      const subprocess = rclone[command](...args);

      // Collects both stdout and stderr from rclone to reply with.
      let stdout = "", stderr = "";
      subprocess.stdout.on("data", (data) => {
        stdout += data;
      });

      subprocess.stdout.on("end", () => {
        stdout && message.reply(stdout, { split: true });
      });

      subprocess.stderr.on("data", (data) => {
        stderr += data;
      });

      subprocess.stderr.on("end", () => {
        stderr && message.reply(stderr, { split: true });
      });

      // Throws error if there is an issue spawning rclone.
      subprocess.on("error", (error) => {
        reject(new Error(`rclone ${ command } ${args.join(" ") } encountered error ${ error.message }`));
      });

      subprocess.on("exit", resolve);
    });
	},
};
