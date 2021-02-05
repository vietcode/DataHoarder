const { extname } = require("path");
const { spawn, ChildProcess } = require("child_process");

const Discord = require("discord.js");
const { getInfo, chooseFormat, downloadFromInfo } = require("ytdl-core");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");

const rclone = require("../bin/rclone.js");
const { bytes, progress } = require("../utils.js");

const {
  RCLONE_CONFIG_TARGET_TEAM_DRIVE,
  RCLONE_CONFIG_TARGET_ROOT_FOLDER_ID,
} = process.env;

const folder = RCLONE_CONFIG_TARGET_ROOT_FOLDER_ID || RCLONE_CONFIG_TARGET_TEAM_DRIVE;

module.exports = {
  name: "ytdl",
  aliases: [],
  description: "Mirroring a YouTube Video",
  guildOnly: true,
  params: [
    {
      name: "url",
      type: "url",
    },
    {
      name: "filename",
      type: "text",
    },
  ],
  usage: "<url>",
  /**
   * Handles the mirror request
   * @param {Discord.Message} message - The incoming chat message.
   * @param {URL} url The URL to download
   */
	async execute(message, url, filename = "") {
    let header = `**File**: ${ filename }`;
    const reply = await message.reply(`${ header }\n**Status**: Pending`);

    const info = await getInfo(url);

    const {
      videoDetails: {
        videoId,
        publishDate,
      },
      formats,
    } = info;

    let audioQuality = "highestaudio";

    // Checks if provided filename contains keyword for video quality, or default to highest.
    let [, videoQuality = "highestvideo" ] = filename.match(/\.(4320p|3072p|2160p|1080p|720p|480p|360p|270p|240p|180p|144p)\./) || [];
    // Checks if provided filename indicates request for HDR content.
    const isHDR = filename.indexOf(".HDR.") > -1;
    videoQuality += isHDR ? " HDR" : "";

    let audioFormat, videoFormat;

    try {
      audioFormat = chooseFormat(formats, {
        // Only want formats with audio only
        filter: "audioonly",
        // We just want highest audio quality.
        quality: audioQuality,
      });
    } catch(error) {
      reply.edit(`${ header }\n**Error**: No such format found: ${ audioQuality }`);
      return;
    };

    try {
      videoFormat = chooseFormat(formats, {
        // Filters for video formats that match requesting quality.
        filter: ({ qualityLabel, hasVideo, hasAudio }) => {
          if (!hasVideo) return false;
          if (hasAudio) return false;
          if (videoQuality === "highestvideo") return true;

          return qualityLabel.indexOf(videoQuality) > -1;
        },
        // We want higest matching video quality.
        quality: "highestvideo",
      });
    } catch(error) {
      reply.edit(`${ header }\n**Error**: No such format found: ${ videoQuality }`);
      return;
    };

    const { audioCodec, contentLength: audioSize } = audioFormat;
    const { qualityLabel: resolution, videoCodec, contentLength: videoSize } = videoFormat;

    const fileSize = parseInt(audioSize) + parseInt(videoSize);

    if (!filename) {
      filename = [
        videoId,
        publishDate.substring(0, 4), // year
        resolution.replace(" HDR, HFR", ""), // resolution
        "YT.WEB-DL",
        videoCodec.toUpperCase(), // VP9, VP8, H.264,...
        isHDR? "HDR" : "",
        audioCodec.toUpperCase(), // OPUS, VORBIS, AAC,...
        "mkv",
      ].filter(Boolean).join(".");
    }

    header = `**File**: ${ filename } (${ bytes(fileSize) })`;
    reply.edit(`${ header }\n**Status**: Downloading...`);

    let container = "matroska";

    switch (extname(filename)) {
      case ".mkv":
        container = "matroska";
        break;
      case ".mp4":
        container = "mp4";
        break;
      case ".webm":
        container = "webm";
        break;
    }

    const audio = downloadFromInfo(info, { format: audioFormat });
    const video = downloadFromInfo(info, { format: videoFormat });

    const rcat = rclone.rcat(`target:${ filename }`);

    rcat.stderr.on("data", (data) => {
      console.log(`stderr: ${ data }`);
    });

    rcat.stdout.on("end", () => {
      // Retrieves ID of the new file.
      const lsf = rclone.lsf(`target:${ filename }`, "--format", "i");
      let id = "";

      lsf.stdout.on("data", data => {
        id += data;
      });

      lsf.stdout.on("end", () => {
        const author = message.author;

        const downloadEmbed = new Discord.MessageEmbed()
          .setTitle(filename)
          .setURL(`https://drive.google.com/file/d/${ id.trim() }`)
          .setAuthor(author.username, author.displayAvatarURL())
          .setDescription(`Size: ${ bytes(fileSize) }\n[Folder](https://drive.google.com/drive/folders/${ folder })`)
          .setTimestamp();

        reply.edit(`File uploaded:`, {
          embed: downloadEmbed,
        });
      });
    });

    const ffmpegProcess = spawn(ffmpeg.path, [
      // Remove ffmpeg's console spamming
      "-loglevel", "8", "-hide_banner",
      // Set inputs
      "-i", "pipe:3",
      "-i", "pipe:4",
      // Map audio & video from streams
      "-map", "0:a",
      "-map", "1:v",
      // Keep encoding
      "-c:v", "copy",
      // Define output container
      "-f", container, "pipe:5",
    ], {
      windowsHide: true,
      stdio: [
        /* Standard: stdin, stdout, stderr */
        "inherit", "inherit", "inherit",
        /* Custom: pipe:3, pipe:4, pipe:5 */
        "pipe", "pipe", "pipe",
      ],
    });

    progress(ffmpegProcess.stdio[5], {
      delay: 1000,
      total: fileSize,
    }).on("progress", ({ doneh, rateh, etaDate }) => {
      reply.edit(`${ header }\n**Status**: ${ doneh } @ ${ rateh }/s. ETA: ${ etaDate.toLocaleString() }.`);
    });

    audio.pipe(ffmpegProcess.stdio[3]);
    video.pipe(ffmpegProcess.stdio[4]);
    ffmpegProcess.stdio[5].pipe(rcat.stdin);
	},
};
