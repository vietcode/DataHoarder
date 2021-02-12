module.exports = {
  name: "list",
  aliases: [],
  description: "List files based on a query",
  params: [
    {
      name: "query",
      type: "text",
    },
  ],
  usage: "<query>",
  /**
   * List files matching a query
   * @param {Discord.Message} message - The incoming chat message.
   * @param {string} query The query text to search for
   */
	async execute(message, query = "") {
    const commands = /** @type { Discord.Collection } */(message.client.commands);
    const args = [
      "lsf",
      "--separator", " | ", "--files-only", "--format", "tsp",
      "--ignore-case",
      "--include", `**${ query }**`,
      "target:"
    ];

    return commands.get("rclone").execute(message, ...args);
  },
};
