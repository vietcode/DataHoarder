const Discord = require("discord.js");

module.exports = {
  name: "fshare",
  aliases: [],
  description: "Mirroring from fshare.vn",
  params: [
    {
      name: "url",
      type: "url",
    },
  ],
  usage: "<folder/file link>",
  /**
   * Downloads an FShare link
   * @param {Discord.Message} message - The incoming chat message.
   * @param {URL} url The URL to download
   */
	execute(message, url) {
    message.channel.send(`Downloading ${ url }`);
	},
};
