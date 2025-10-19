import { help, start, getTgId, addMeme } from "./bot/commands/bot.commands.js";
import connect from "./config/database.config.js";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
dotenv.config();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
connect();
// commands
start(bot);
help(bot);
getTgId(bot);
addMeme(bot);
bot.launch().then(() => console.log("bot is running 🚀"));
//# sourceMappingURL=index.js.map