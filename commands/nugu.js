const { basename, extname } = require("path");

const debug = require("debug")("hoarder:nugu");
const Discord = require("discord.js");
const nugu = require("nugu");

const {
  USENET_POST_PROGRESS,
  USENET_POST_GROUPS,
} = process.env;

module.exports = {
  name: "nugu",
  aliases: [],
  description: "Posts a file to a Newserver",
  guildOnly: true,
  params: [
    {
      name: "sourcePath",
      type: "text",
    },
    {
      name: "groups",
      type: "text",
    },
  ],
  usage: "<sourcePath>",
  /**
   * Handles the posting request
   * @param {Discord.Message} reply - The reply message.
   * @param {string} sourcePath The path to the source to post.
   * @param {string} [groups] Comma-separated list of groups to post to.
   */
	async execute(reply, sourcePath, groups = USENET_POST_GROUPS) {
    const referencedMessage = reply.referencedMessage;
    const { channel, author } = referencedMessage;

    const { displayName, guild } = channel.members.get(author.id);

    let remote = "target";
    const title = basename(sourcePath);

    debug(`upload ${ sourcePath }`);

    let header = `**Source**: ${ sourcePath }`;

    reply.edit(`${ header }\n**Status**: Uploading`);

    // @TODO: Parse file name to set `nzb-tag` and `nzb-category` and `meta` options.

    const nzb = await nugu(`${ remote }:${ sourcePath }`, {
      groups,
      // Use the reply's ID in place of filename in subject .
      subject: `{comment} [{0filenum}/{files}] - "${ reply.id }" yEnc ({part}/{parts}) {filesize} {comment2}`,
      // Use the requester's nickname.
      from: `${ displayName } <${ author.discriminator }@${ guild.name }.>`,
      // Places the title in <head> of the NZB.
      "nzb-title": title,
      // Uses the remote file ID as name, but keeps extension.
      filename: ({ ID, Name }) => `${ ID }${ extname(Name) }`,
      progress: USENET_POST_PROGRESS || function({ articles, files, totalSize, read, posted, checked }) {
        reply.edit(`${ header } (${ totalSize })\n**Status**: ${ posted }/${ articles } article(s) posted. ${ checked } article(s) checked.`);
      },
      // Enable 1 connection for post checking.
      "check-connections": 1,
    });

    // Create an embed and attach the NZB file to it.
    const embed = {
      files: [{
        name: `${ title }.nzb`,
        attachment: nzb,
      }],
    }

    // Can't attach a file to an existing reply, so we delete it and create new one.
    await reply.delete();

    referencedMessage.reply({
      embed,
    });
	},
};
