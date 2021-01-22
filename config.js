require("nvar")();

const { PREFIX = "/", DISCORD_TOKEN } = process.env;

module.exports = {
	"prefix": PREFIX,
	"token": DISCORD_TOKEN,
}
