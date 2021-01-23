"use strict";

const fs = require("fs");

const Discord = require("discord.js");
const { prefix, token } = require("./config");

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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", message => {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = commands.get(commandName)
    || commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  try {
    const params = command.params || [];
    let errors = [];

    if (params.length && !args.length) {
      errors.push(`You didn't provide any arguments, ${message.author}!`);
    }

    args.forEach((arg, index) => {
      const { name, type } = params[index];

      switch (type) {
        case "url":
          try {
            args[index] = new URL(arg);
          } catch(_) {
            errors.push(`Invalid argument for ${ name }`);
          }
          break;

        default:
          break;
      }
    });

    if (errors.length) {
      if (command.usage) {
        errors.push(`Usage: \`${prefix}${command.name} ${command.usage}\``);
      }

      return message.channel.send(errors.join("\n"));
    }

    command.execute(message, ...args);
  } catch (error) {
    console.error(error);
    message.reply("there was an error trying to execute that command!");
  }
});

client.login(token);
