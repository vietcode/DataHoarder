#!/usr/bin/env node

/**
 * A wrapper around `rclone.js` to set our own config file.
 */

const { join } = require("path");

require("nvar")();

if (!process.env.RCLONE_CONFIG) {
  const CWD = process.cwd();
  const RCLONE_DIR = join(CWD, "bin");
  process.env.RCLONE_CONFIG = join(RCLONE_DIR, "rclone.conf");
}

const rclone = require("rclone.js");

const [/** node **/, /** file **/, commandName, ...args] = process.argv;
if (commandName) {
  require("rclone.js/bin/rclone.js");
}

module.exports = rclone;
