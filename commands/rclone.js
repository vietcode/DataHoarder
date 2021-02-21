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
  async: true,
  params: [
    {
      name: "command",
      type: "text",
    },
  ],
  usage: "<command> [arg...]",
  /**
   * Executes rclone commands
   * @param {Discord.Message} reply - The reply message.
   * @param {string} command the command to execute.
   */
	async execute(reply, command, ...args) {
    // Only support a few commands over chat.
    if (COMMANDS.indexOf(command) === -1) {
      debug(`Attempted rclone ${ command } ${ args.join(" ") }`);
      reply.edit("Can't execute that command.");
      return;
    }

    return new Promise((resolve, reject) => {
      debug(`rclone ${ command } ${ args.join(" ") }`);

      const subprocess = rclone[command](...args);

      // Collects both stdout and stderr from rclone to reply with.
      let stdout = "", stderr = "";
      subprocess.stdout.on("data", (data) => {
        stdout += data;
      });

      subprocess.stderr.on("data", (data) => {
        stderr += data;
      });

      subprocess.stdout.on("end", () => {
        stdout = stdout.substring(1, 1998);
        if (stdout.length === 1997) {
          stdout += "...";
        }
        stdout && reply.edit(stdout);
      });

      subprocess.stderr.on("end", () => {
        stderr = stderr.substring(1, 1998);
        if (stderr.length === 1997) {
          stderr += "...";
        }
        stderr && reply.edit(stderr);
      });

      // Throws error if there is an issue spawning rclone.
      subprocess.on("error", (error) => {
        reject(new Error(`rclone ${ command } ${ args.join(" ") } encountered error ${ error.message }`));
      });

      subprocess.on("exit", resolve);
    });
	},
};
