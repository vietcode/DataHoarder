const debug = require("debug")("hoarder:gdrive");

const rclone = require("../bin/rclone.js");

const REGEX = /(?:drive\/)?(?:u\/\d\/)?(?:mobile\/)?(file|folders)\/(?:d\/)?([-\w]+)[?+]?\/?(w+)?/;

module.exports = {
  name: "gdrive",
  aliases: [],
  description: "Mirroring from Google Drive",
  guildOnly: true,
  params: [
    {
      name: "url",
      type: "url",
    },
    {
      name: "destpath",
      type: "text",
    },
  ],
  usage: "<gdrive link> [destpath]",
  /**
   * Downloads a Google Drive link
   * @param {Discord.Message} reply - The reply message.
   * @param {URL} url The URL to download
   * @param {string} [destpath] Path to Google Drive to save file to.
   */
  async execute(reply, url, destpath = "") {
    const { pathname } = url;
    const [, type, id] = pathname.match(REGEX) || [];

    if (!id) {
      throw new Error("Invalid Google Drive link");
    }

    debug(`Copy ${ type }/${ id }`);

    reply.edit(`**Status**: Pending`);

    const args = [];
    if (type === "file") {
      args.push("backend", "copyid", "source:", id, `target:${ destpath }`);
    } else if (type === "folders") {
      args.push("copy", "source:", `target:${ destpath }`);
      process.env.RCLONE_CONFIG_SOURCE_ROOT_FOLDER_ID = id;
    }

    args.push("--stats-one-line", "-P", "--stats", "2s");

    debug(`rclone ${ args.join(" ") }`);

    return new Promise((resolve, reject) => {
      const subprocess = rclone(...args);
      let status = "";

      subprocess.stdout.on("data", (data) => {
        status += data;
        // Truncate to the last 1997 characters.
        status = status.substring(status.length - 1997);
        if (status.length === 1997) {
          status = "..." + status;
        }
        reply.edit(`${ status }`);
      });

      // Throws error if there is an issue spawning rclone.
      subprocess.on("error", (error) => {
        reject(new Error(`rclone ${ command } ${ args.join(" ") } encountered error ${ error.message }`));
      });

      subprocess.on("exit", resolve);
    });

  }
}
