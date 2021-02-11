"use strict";

const fs = require("fs");

const debug = require("debug")("hoarder:discord");
const shellParser = require("shell-parser");
const Discord = require("discord.js");
const Queue = require("fastq");

require("nvar")();
const {
  COMMAND_PREFIX = "/", COMMAND_SUFFIX = "",
  DISCORD_TOKEN,
  MAX_JOBS = 4,
} = process.env;

// Regex to check if a message contains command.
const COMMAND_REGEX = new RegExp(`^${ COMMAND_PREFIX }([a-z-]+)${ COMMAND_SUFFIX }\\s+`);

const client = new Discord.Client();
const commands = client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  /** @type {object} */
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	commands.set(command.name, command);
}

const jobs = Queue(worker, parseInt(MAX_JOBS));

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // @TODO: enqueues broken or pending tasks from message list.
});

client.on("message", async message => {
  const [, commandName] = message.content.trim().match(COMMAND_REGEX) || [];
  if (!commandName) return;

  // Parse for arguments, ignoring the first item because it's the command name.
  const [, ...args] = shellParser(message.content);

  debug(`Received command ${ message.content.trim() }`);

  const command = commands.get(commandName)
    || commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  await message.suppressEmbeds(true);

  if (command.guildOnly && message.channel.type === "dm") {
    return message.reply(`I can't execute that command inside DMs!`);
  }

  const params = command.params || [];
  let errors = [];

  if (params.length && !args.length) {
    errors.push(`You didn't provide any arguments, ${message.author}!`);
  }

  // Validates arguments.
  args.forEach((arg, index) => {
    const { name, type = "text" } = params[index] || {};

    switch (type) {
      case "url":
        try {
          const url = new URL(arg);
          if (url.protocol === "file:") {
            throw new Error("File protocol is not supported");
          }
          args[index] = url;
        } catch(_) {
          errors.push(`Invalid argument for ${ name }`);
        }
        break;

      default:
        break;
    }
  });

  // Replies with error if any.
  if (errors.length) {
    if (command.usage) {
      errors.push(`Usage: \`${ COMMAND_PREFIX }${command.name}${ COMMAND_SUFFIX} ${command.usage}\``);
    }

    return message.channel.send(errors.join("\n"));
  }

  // Acknowledge request received.
  const reaction = await message.react("🕐");

  // Push request into our job queue.
  jobs.push({ message, command, args, reaction, }, (error, reply) => {
    if (error) {
      message.reply(error.message);
      return;
    }
  });
});

client.login(DISCORD_TOKEN);

// A simple worker that is run for each job.
async function worker({ message, command, args, reaction }, cb) {
  try {
    // Removes the reaction to indicate the request being started.
    await reaction.remove();
    const reply = await command.execute(message, ...args);
    cb(null, reply);
  } catch(error) {
    cb(error);
  }
}
