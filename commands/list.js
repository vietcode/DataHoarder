module.exports = {
  name: "list",
  aliases: [],
  description: "List files based on a query",
  async: true,
  params: [
    {
      name: "query",
      type: "text",
    },
  ],
  usage: "<query>",
  /**
   * List files matching a query
   * @param {Discord.Message} reply - The reply message.
   * @param {string} query The query text to search for
   */
	async execute(reply, query = "") {
    const commands = /** @type { Discord.Collection } */(reply.client.commands);
    const args = [
      "lsf",
      "--separator", " | ",
      "-R", "--files-only",
      "--format", "tsp",
      "--ignore-case",
      "--include", `**${ query }**`,
      "target:"
    ];

    return commands.get("rclone").execute(reply, ...args);
  },
};
