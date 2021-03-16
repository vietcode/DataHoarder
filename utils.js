const { throttle } = require("throttle-debounce");

const rclone = require("./bin/rclone.js");

/**
 * Formats bytes into human-readable units.
 * @param {number} bytes The number of bytes
 * @param {number} [decimals=2] Number of decimal points
 */
function bytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Emits progress of a readable stream
 * @param {ReadableStream} stream
 * @param {object} options
 * @param {number} [options.delay=0]
 * @param {number} options.total - Expected total number of bytes to receive.
 * @returns {ReadableStream} the input stream for chaining.
 */
function progress(stream, { delay = 0, total } = {}) {
  const startAt = Date.now();
  let done = 0, elapsed, rate, estimated, progress, eta;

  function onProgress() {
    const now = new Date();
    elapsed = (now - startAt) / 1000;
    rate = done / elapsed;

    if (total) {
      estimated = total / rate;
      progress = done / total;
      eta = estimated - elapsed;
      now.setSeconds(now.getSeconds() + eta);
    }

    stream.emit("progress", {
      total,
      done,
      totalh: bytes(total),
      doneh: bytes(done),
      startAt,
      elapsed,
      rate,
      rateh: bytes(rate),
      estimated,
      progress,
      eta,
      etaDate: now,
    });
  }

  const throttled = throttle(delay, onProgress);

  stream.on("data", (chunk) => {
    done += chunk.length;
    return throttled();
  });

  stream.on("end", () => {
    onProgress();
    stream.emit("finish");
  });

  return stream;
}

/**
 * Perform a `rclone rcat` from a stream to a file.
 * @param {ReadableStream} stream
 * @param {string} filename The file name to store
 */
function rcat(stream, filename) {
  return new Promise((resolve, reject) => {
    const rcat = rclone.rcat(filename);

    rcat.stderr.on("data", (data) => {
      console.log(`stderr: ${ data }`);
      reject(data.toString());
    });

    rcat.stdout.on("end", async () => {
      // Retrieves ID of the new file.
      const fileId = await rclone.promises.lsf(filename, "--format", "i");
      resolve(fileId);
    });

    stream.pipe(rcat.stdin);
  });
}

module.exports = {
  throttle,
  bytes,
  progress,
  rcat,
};
