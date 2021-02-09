const Discord = require("discord.js");

const {
  COMMAND_MIRROR_ALIASES = "",
} = process.env;

module.exports = {
  name: "mirror",
  aliases: COMMAND_MIRROR_ALIASES.split(/\s+/),
  description: "Mirroring a URL",
  guildOnly: true,
  params: [
    {
      name: "url",
      type: "url",
    },
  ],
  usage: "<url>",
  /**
   * Handles the mirror request
   * @param {Discord.Message} message - The incoming chat message.
   * @param {URL} url The URL to download
   */
	async execute(message, url, ...args) {
    const commands = /** @type { Discord.Collection } */(message.client.commands);
    const { host } = url;

    if (/(www\.)?fshare\.vn/.test(host)) {
      return commands.get("fshare").execute(message, url, ...args);
    } else if (/(www\.)?(youtu\.be|youtube\.com)/.test(host)) {
      return commands.get("ytdl").execute(message, url, ...args);
    } else {
      // Direct links.
      return commands.get("download").execute(message, url, ...args);
    }
	},
};
