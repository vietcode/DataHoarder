"use strict";

const Discord = require("discord.js");
const { prefix, token } = require('./config');

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", message => {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "mirror") {
    let url = args[0];
    try {
      url = new URL(url);
    } catch(error) {
      return message.reply("invalid URL");
    }

    message.channel.send(`Mirroring ${ url }`);
  }
});

client.login(token);
