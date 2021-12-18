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
- Create a `.env` file with the following variables, using the format 
  `export VARIABLE_NAME=variable_value`, one line per variable:
  - For Discord and the bot:
    - `export DISCORD_TOKEN='...'`: The token of the bot retrieved from Discord.
    - `export COMMAND_PREFIX='/'`: (optional) custom prefix for the commands. Default to `/`.
    - `export COMMAND_SUFFIX=''`: (optional) custom suffix for the commands. Default to empty string.
    - `export COMMAND_MIRROR_ALIASES=''`: (optional) Space-separated list of aliases for `mirror` command.
    - `export MAX_JOBS=4`: (optional) maximum number of jobs to run in parallel. Default to 4.
  - For Rclone:
    - `export RCLONE_DRIVE_CLIENT_ID=''`: (optional) Google's client ID for rclone.
    - `export RCLONE_DRIVE_CLIENT_SECRET=''`: (optional) Google's client secret for rclone.
    - `RCLONE_CONFIG_TARGET_TEAM_DRIVE='...'`: The ID of the shared drive to upload file to.
    - `export RCLONE_CONFIG_TARGET_ROOT_FOLDER_ID=''`: (optional) The ID of the folder to upload file to.
    - `export RCLONE_CONFIG_TARGET_TOKEN`='': (optional) access token to the target folder.
    - `export RCLONE_CONFIG_TARGET_SERVICE_ACCOUNT_FILE=''`: (optional) path to service account file with access to the target folder.
    - `export RCLONE_EXECUTABLE=''`: (optional) path to custom `rclone` executable, such as `gclone`, `fclone`.
    - `export RCLONE_CONFIG_TARGET_SERVICE_ACCOUNT_FILE_PATH=''`: (optional) path to the folder contains service account files. This setting is used by the variants of `rclone`.
  - For FShare:
    - `export FSHARE_USER_EMAIL='.'`: VIP email to login.
    - `export FSHARE_PASSWORD=''`: VIP password to login.
  - For Usenet:
    - `export USENET_POST_HOST=''`: Hostname of the news-server to post to.
    - `export USENET_POST_PORT=''`: Port of the news-server to post to.
    - `export USENET_POST_USER=''`
    - `export USENET_POST_PASSWORD=''`
    - `export USENET_POST_FROM=''`: The name and email of the poster. Default to "{Discord display name} <{Discord discriminator}@{Guild's name}>"
    - `export USENET_POST_GROUPS='alt.binaries.test'`: Comma-separated group names to post to. Default to "alt.binaries.test".
- Inside the project, `npm install` to install dependencies.
- `npm start` to start the bot.

`DataHoarder` should appear on your Discord's roster.
