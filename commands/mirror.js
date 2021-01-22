module.exports = {
  name: "mirror",
  aliases: [],
  description: "Mirroring a URL",
  args: true,
  usage: "<url>",
	execute(message, [url = ""]) {
    try {
      url = new URL(url);
    } catch(error) {
      return message.reply(`"${url}" is not valid.`);
    }

    message.channel.send(`Mirroring ${ url }`);
	},
};
