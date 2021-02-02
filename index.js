"use strict";

const fs = require("fs");

const Discord = require("discord.js");

require("nvar")();
const { PREFIX = "/", DISCORD_TOKEN } = process.env;

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
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

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
