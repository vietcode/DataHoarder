# Data Hoarder

A bot for hoarding any data from Discord.

[![Run on Repl.it](https://repl.it/badge/github/vietcode/DataHoarder)](https://repl.it/github/vietcode/DataHoarder)

## Commands

- `/mirror <url>` - download any URL to a remote destination.
- `/download <url>` - download a direct link to a remote destination.
- `/fshare <url>` - download a file or a folder on Fshare.vn to a remote destination.

## Getting Started

- Install Node.js v14+ (for `discord.js@13` that uses optional chaining)
- Set up a bot on Discord.
- Add the bot to your server.
- Clone the repo.
- Create a `.env` file with the following variables:
  - `DISCORD_TOKEN`: The token of the bot retrieved from Discord.
  - `PREFIX`: (optional) custom prefix for the commands. Default to `/`.
  - `RCLONE_DRIVE_CLIENT_ID`: (optional) Google's client ID for rclone.
  - `RCLONE_DRIVE_CLIENT_SECRET`: (optional) Google's client secret for rclone.
  - `FSHARE_USER_EMAIL`: VIP email to login.
  - `FSHARE_PASSWORD`: VIP password to login.
- Inside the project, `npm install` to install dependencies.
- `npm start` to start the bot.

`DataHoarder` should appear on your Discord's roster.
