const { basename, extname, join } = require("path");

const debug = require("debug")("hoarder:download");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const ps = require("ps-node");

const { bytes, progress, rcat } = require("../utils.js");

const {
  RCLONE_CONFIG_TARGET_TEAM_DRIVE,
  RCLONE_CONFIG_TARGET_ROOT_FOLDER_ID,
} = process.env;

const folder = RCLONE_CONFIG_TARGET_ROOT_FOLDER_ID || RCLONE_CONFIG_TARGET_TEAM_DRIVE;

async function editReply(reply, content) {
  if (reply.deleted) return;

  return reply.edit(content).catch(error => {
    // Reply was deleted but request was still in progress.
    // @TODO: Ignore only when it's a unknown message error.
  });
}

module.exports = {
  name: "download",
  aliases: [],
  description: "Downloads a file at an URL to a Google Drive location",
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
  usage: "<url> [destpath]",
  /**
   * Downloads a link to a Google Drive folder
   * @param {Discord.Message} reply - The reply message.
   * @param {URL} url The URL to download
   * @param {string} [destpath] Path to Google Drive to save file to.
   */
	async execute(reply, url, destpath = basename(url.pathname)) {
    const { client, referencedMessage } = reply;

    let remote = "target";

    // If `destpath` is a folder, append the filename from URL.
    if (!extname(destpath)) {
      destpath = join(destpath, basename(url.pathname));
    }

    destpath = decodeURIComponent(destpath);

    debug(`download ${ url } ${ destpath }`);

    let header = `**File**: ${ destpath }`;

    editReply(reply, `${ header }\n**Status**: Pending`);

    const response = await fetch(url, {
      method: "get",
      headers: {},
    });

    if (!response.ok) { // res.status >= 200 && res.status < 300
      throw Error(response.status);
    }

    const fileSize = Number(response.headers.get("content-length"));

    if (fileSize) {
      header += ` (${ bytes(fileSize) })`;
    }

    editReply(reply, `${ header }\n**Status**: Downloading...`);

    function onRequestDeleted(deletedMessage) {
      if (deletedMessage.id === referencedMessage.id) {
        debug(`request deleted. Cancelling execution.`);

        ps.lookup({
          command: "rclone",
          arguments: `${ remote }:${ destpath }`,
        }, (error, resultList) => {
          if (error) {
            console.error(error);
            return;
          }

          resultList.forEach(async (process) => {
            if( process ){
              debug(`Deleting reply.`);
              response.body.destroy();
              reply.delete();
              ps.kill(process.pid);
            }
          });
        });

        client.off("messageDelete", onRequestDeleted);
      }
    }

    // If the request message is deleted, we cancel the job.
    client.on("messageDelete", onRequestDeleted);

    progress(response.body, {
      delay: 1000,
      total: fileSize,
    }).on("progress", async ({ doneh, rateh, etaDate }) => {
      editReply(reply, `${ header }\n**Status**: ${ doneh } @ ${ rateh }/s. ETA: ${ etaDate.toLocaleString() }.`);
    });

    response.body.on("error", (error) => {
      throw error;
    });

    response.body.on("end", () => {
      editReply(reply, `${ header }\n**Status**: Finishing last bytes...`);
    });

    const fileId = await rcat(response.body, `${ remote }:${ destpath }`);

    client.off("messageDelete", onRequestDeleted);

    editReply(reply, `${ header }\nhttps://drive.google.com/file/d/${ fileId }`);
	},
};
