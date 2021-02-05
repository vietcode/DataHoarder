"use strict";

const fs = require("fs");

const debug = require("debug")("bot");
const shellParser = require("shell-parser");
const Discord = require("discord.js");

const rclone = require("./bin/rclone.js");

require("nvar")();
const { PREFIX = "/", SUFFIX = "", DISCORD_TOKEN, HOSTNAME = "", PORT } = process.env;

// Regex to check if a message contains command.
const COMMAND_REGEX = new RegExp(`^${ PREFIX}([a-z-]+)${ SUFFIX }\\s+`);

const bot = new Discord.Client();
const commands = bot.commands = new Discord.Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  /** @type {object} */
	const command = require(`./commands/${file}`);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	commands.set(command.name, command);
}

bot.on("ready", () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on("message", async message => {
  const [, commandName] = message.content.trim().match(COMMAND_REGEX) || [];
  if (!commandName) return;

  // Parse for arguments, ignoring the first item because it's the command name.
  const [, ...args] = shellParser(message.content);

  debug(`Received command ${ message.content.trim() }`);

  const command = commands.get(commandName)
    || commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (command.guildOnly && message.channel.type === "dm") {
    return message.reply(`I can't execute that command inside DMs!`);
  }

  try {
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
        errors.push(`Usage: \`${PREFIX}${command.name} ${command.usage}\``);
      }

      return message.channel.send(errors.join("\n"));
    }

    await command.execute(message, ...args);
  } catch (error) {
    console.error(error);
    message.reply("there was an error trying to execute that command!");
  }
});

bot.login(DISCORD_TOKEN);

if (typeof PORT !== "undefined") {
  // Serving the target remote as index.
  const server = rclone.serve("http", "target:", "--addr", `${ HOSTNAME }:${ PORT }`);

  server.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  server.stderr.on("data", (data) => {
    console.error(data.toString());
  });
}
