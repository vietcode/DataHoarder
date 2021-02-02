#!/usr/bin/env node

const { join } = require("path");
const { spawn } = require("child_process");

let { platform, arch } = process;

switch (platform) {
  case "darwin":
    platform = "osx";
    break;
  case "freebsd":
  case "linux":
  case "openbsd":
    break;
  case "sunos":
    platform = "solaris";
  case "win32":
    platform = "windows";
  default:
    break;
}

switch (arch) {
  case "arm":
  case "arm64":
  case "mips":
  case "mipsel":
    break;
  case "x32":
    arch = "386";
  case "x64":
    arch = "amd64";
  default:
    break;
}

const CWD = process.cwd();
const RCLONE_DIR = join(CWD, "bin");
const RCLONE = join(RCLONE_DIR, `rclone${ platform === "windows"? ".exe" : "" }`);
const CONFIG = join(RCLONE_DIR, "rclone.conf");

/**
 * Updates rclone binary based on current OS.
 */
async function update() {
  const { chmodSync } = require("fs");

  const fetch = require("node-fetch");
  const AdmZip = require("adm-zip");

  console.log("Downloading latest rclone...");

  return fetch(`https://downloads.rclone.org/rclone-current-${ platform }-${ arch }.zip`)
  .then(response => response.buffer())
  .then(buffer => {
    console.log("Extracting rclone...");

    const zip = new AdmZip(buffer);

    var zipEntries = zip.getEntries();

    zipEntries.forEach((entry) => {
      if (/rclone(\.exe)?$/.test(entry.name)) {
        zip.extractEntryTo(entry, RCLONE_DIR, false, true);
        // Make it executable.
        chmodSync(RCLONE, 0o755);

        console.log(`${ entry.entryName } is installed.`);
      }
    });
  });
}

const api = {
  update,
}

const COMMANDS = ["config", "copy", "sync", "move", "purge", "mkdir", "rmdir", "check", "ls", "lsd", "delete", "size", "mount", "cat", "rcat", "serve", "help"];

COMMANDS.forEach(command => {
  api[command] = function() {
    const args = [
      "--config",
      CONFIG,
      command,
      ...arguments,
    ];

    return spawn(RCLONE, args);
  }
});

const [/** node **/, /** file **/, commandName, ...args] = process.argv;

// Executes rclone command if available.
const command = api[commandName];

if (command) {
  const process = command(...args);

  if (COMMANDS.indexOf(commandName) > -1) {
    process.stdout.on("data", (data) => {
      console.log(data.toString());
    });
  }
}

module.exports = api;
