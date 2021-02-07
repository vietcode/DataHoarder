const rclone = require("./bin/rclone.js");

require("nvar")();
const {
  HOSTNAME = "", PORT,
} = process.env;

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
