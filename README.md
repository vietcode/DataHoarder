# Data Hoarder

A bot for hoarding any data from Discord.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
[![Run on Repl.it](https://repl.it/badge/github/vietcode/DataHoarder)](https://repl.it/github/vietcode/DataHoarder)

## Commands

- `/mirror <url> [destpath]` - download any URL to a remote destination.
- `/download <url> [destpath]` - mirror a direct link.
- `/fshare <url> [destpath]` - mirror a file on Fshare.vn.
- `/ytdl <url>` - mirror a YouTube video.
- `/list <query>` - search for files matching the query.

## Getting Started

- Install Node.js v14+ (for `discord.js@13` that uses optional chaining)
- Set up a bot on Discord.
- Add the bot to your server.
- Clone the repo.
- Create a `.env` file with the following variables:
  - `DISCORD_TOKEN`: The token of the bot retrieved from Discord.
  - `COMMAND_PREFIX`: (optional) custom prefix for the commands. Default to `/`.
  - `COMMAND_SUFFIX`: (optional) custom suffix for the commands. Default to empty string.
  - `RCLONE_DRIVE_CLIENT_ID`: (optional) Google's client ID for rclone.
  - `RCLONE_DRIVE_CLIENT_SECRET`: (optional) Google's client secret for rclone.
  - `RCLONE_CONFIG_TARGET_TEAM_DRIVE`: The ID of the shared drive to upload file to.
  - `RCLONE_CONFIG_TARGET_ROOT_FOLDER_ID`: (optional) The ID of the folder to upload file to.
  - `RCLONE_CONFIG_TARGET_TOKEN`: (optional) access token to the target folder.
  - `RCLONE_CONFIG_TARGET_SERVICE_ACCOUNT_FILE`: (optional) path to service account file with access to the target folder.
  - `FSHARE_USER_EMAIL`: VIP email to login.
  - `FSHARE_PASSWORD`: VIP password to login.
  - `COMMAND_MIRROR_ALIASES`: (optional) Space-separated list of aliases for `mirror` command.
  - `MAX_JOBS`: (optional) maximum number of jobs to run in parallel. Default to 4.
- Inside the project, `npm install` to install dependencies.
- `npm start` to start the bot.

`DataHoarder` should appear on your Discord's roster.
