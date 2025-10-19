import { help, start, getTgId, addMeme, daily, battle, mood, language, random, top, mymemes, streak, about, report } from "./bot/commands/bot.commands.js";
import connect from "./config/database.config.js";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { upDownCallback, battleCallback, moodCallback, languageCallback, randomCallback, topMemesCallback } from "./bot/callbacks/bot.callbacks.js";
dotenv.config();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
connect();
// commands
start(bot);
help(bot);
getTgId(bot);
addMeme(bot);
daily(bot);
battle(bot);
mood(bot);
language(bot);
random(bot);
top(bot);
mymemes(bot);
streak(bot);
about(bot);
report(bot);
// callbacks
upDownCallback(bot);
battleCallback(bot);
moodCallback(bot);
randomCallback(bot);
topMemesCallback(bot);
bot.launch().then(() => console.log("bot is running 🚀"));
//# sourceMappingURL=index.js.map