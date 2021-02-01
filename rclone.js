#!/usr/bin/env node

const { join } = require("path");
const { chmodSync } = require("fs");

const fetch = require("node-fetch");
const AdmZip = require("adm-zip");

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

console.log("Downloading latest rclone...");

fetch(`https://downloads.rclone.org/rclone-current-${ platform }-${ arch }.zip`)
.then(response => response.buffer())
.then(buffer => {
  console.log("Extracting rclone...");

  const targetPath = join(__dirname, "bin");
  const zip = new AdmZip(buffer);

  var zipEntries = zip.getEntries();

  zipEntries.forEach((entry) => {
    if (/rclone(\.exe)?$/.test(entry.name)) {
      zip.extractEntryTo(entry, targetPath, false, true);
      // Make it executable.
      chmodSync(join(targetPath, entry.name), 0o755);

      console.log(`${ entry.entryName } is installed.`);
    }
  });
});
