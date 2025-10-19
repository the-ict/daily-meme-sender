import { Telegraf } from "telegraf";
import dotenv from "dotenv";
dotenv.config();
console.log(process.env.TELEGRAM_TOKEN, 'telegram token');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
bot.start(ctx => {
    ctx.reply("Hello! I'm a bot that sends memes every day!");
});
bot.launch();
//# sourceMappingURL=index.js.map