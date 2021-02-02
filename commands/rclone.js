const Discord = require("discord.js");

const rclone = require("../bin/rclone.js");

const COMMANDS = [
  "ls",
  "lsd",
  "check",
  "size",
]

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
      const process = rclone[command](...args);

      // Collects both stdout and stderr from rclone to reply with.
      let stdout = "", stderr = "";
      process.stdout.on("data", (data) => {
        stdout += data;
      });

      process.stdout.on("end", () => {
        stdout && message.reply(stdout, { split: true });
      });

      process.stderr.on("data", (data) => {
        stderr += data;
      });

      process.stderr.on("end", () => {
        stderr && message.reply(stderr, { split: true });
      });

      // Throws error if there is an issue spawning rclone.
      process.on("error", (error) => {
        reject(new Error(`rclone ${ command } ${args.join(" ") } encountered error ${ error.message }`));
      });

      process.on("exit", resolve);
    });
	},
};
