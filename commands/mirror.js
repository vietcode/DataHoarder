const Discord = require("discord.js");

module.exports = {
  name: "mirror",
  aliases: [],
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
	async execute(message, url) {
    message.suppressEmbeds(true);

    const commands = /** @type { Discord.Collection } */(message.client.commands);
    const { host } = url;

    if (/(www\.)?fshare\.vn/.test(host)) {
      return commands.get("fshare").execute(message, url);
    } else if (/(www\.)?(youtu\.be|youtube\.com)/.test(host)) {
      return commands.get("ytdl").execute(message, url);
    } else {
      // Direct links.
      return commands.get("download").execute(message, url);
    }
	},
};
