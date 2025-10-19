import { help, start, getTgId, addMeme, daily } from "./bot/commands/bot.commands.js";
import connect from "./config/database.config.js";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { upDownCallback } from "./bot/callbacks/bot.callbacks.js";
dotenv.config();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
connect();
// commands
start(bot);
help(bot);
getTgId(bot);
addMeme(bot);
daily(bot);
//callbacks
upDownCallback(bot);
bot.launch().then(() => console.log("bot is running 🚀"));
//# sourceMappingURL=index.js.map