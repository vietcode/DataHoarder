const Discord = require("discord.js");

module.exports = {
  name: "mirror",
  aliases: [],
  description: "Mirroring a URL",
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
	execute(message, url) {
    const commands = /** @type { Discord.Collection } */(message.client.commands);
    const { host } = url;

    if (host === "fshare.vn") {
      commands.get("fshare").execute(message, url);
    } else {
      // Direct links.
      message.channel.send(`Mirroring ${ url }`);
    }
	},
};
