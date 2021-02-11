const debug = require("debug")("hoarder:fshare");
const Discord = require("discord.js");
const fetch = require("node-fetch");

const {
  FSHARE_APP_KEY = "L2S7R6ZMagggC5wWkQhX2+aDi467PPuftWUMRFSn",
  FSHARE_USER_EMAIL = "",
  FSHARE_PASSWORD = "",
} = process.env;

const API_URL = "https://api.fshare.vn/api";
const USER_AGENT = "Fshare/1 CFNetwork/1209 Darwin/20.2.0";

async function checkStatus(response) {
  if (response.ok) { // response.status >= 200 && response.status < 300
    return response;
  } else {
    const { msg } = await response.json();
    throw Error(msg);
  }
}

/**
 * An FShare session with ID and token.
 * @typedef {Object} Session
 * @property {string} session_id - The ID of the session
 * @property {string} token - Token
 */

/**
 * Sends a POST request
 * @param {string} endpoint - API endpoint to send a POST to
 * @param {Object} body - A JSON of payload to send
 * @param {Object} [headers={}] - Custom headers
 * @returns {Promise<object>}
 */
async function post(endpoint, body, headers = {}) {
  return fetch(`${API_URL}${ endpoint }`, {
    method: "post",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  })
  .then(checkStatus)
  .then(response => response.json());
}

/**
 * Logins into Fshare
 * @param {Object} credentials
 * @returns {Promise<Session>}
 */
async function login({
  user_email = FSHARE_USER_EMAIL,
  password = FSHARE_PASSWORD,
  app_key = FSHARE_APP_KEY,
} = {}) {
  return post("/user/login", {
    user_email,
    password,
    app_key,
  });
}

module.exports = {
  name: "fshare",
  aliases: [],
  description: "Mirroring from fshare.vn",
  guildOnly: true,
  params: [
    {
      name: "url",
      type: "url",
    },
    {
      name: "destpath",
      type: "text",
    },
  ],
  usage: "<folder/file link> [destpath]",
  /**
   * Downloads an FShare link
   * @param {Discord.Message} message - The incoming chat message.
   * @param {URL} url The URL to download
   * @param {string} [destpath] Path to Google Drive to save file to.
   */
  async execute(message, url, destpath = "") {
    // Removes any search params.
    url.search = "";

    debug("Logging in...");
    const { token, session_id } = await login();
    debug(`Retrieving download link for ${ url }`);
    const { location } = await post("/session/download", {
      url,
      token,
      password: "",
    }, {
      // Fshare requires the `session_id` set in cookie.
      "Cookie": `session_id=${ session_id }`,
    });

    debug(`Downloading ${ location }`);
    const commands = /** @type { Discord.Collection } */(message.client.commands);
    return commands.get("download").execute(message, new URL(location), destpath);
  },
};
