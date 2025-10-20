import { help, start, getTgId, addMeme, daily, battle, mood, language, random, top, mymemes, streak, about, report } from "./bot/commands/bot.commands.js";
import connect from "./config/database.config.js";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { upDownCallback, battleCallback, moodCallback, languageCallback, randomCallback, topMemesCallback } from "./bot/callbacks/bot.callbacks.js";
import cron from "node-cron";
import usersModel from "./models/users.model.js";
import memeModel from "./models/meme.model.js";
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
cron.schedule("0 8 * * *", async () => {
    try {
        console.log("Starting daily meme broadcast...");
        const unsentMeme = await memeModel.findOne({ sent: { $ne: true } });
        if (!unsentMeme) {
            console.log("No unsent memes available for daily broadcast.");
            return;
        }
        const users = await usersModel.find({});
        if (users.length === 0) {
            console.log("No users to send memes to.");
            return;
        }
        for (const user of users) {
            try {
                await bot.telegram.sendPhoto(user.telegram_id, unsentMeme.image, {
                    caption: `🌅 <b>Kunlik Meme!</b>\n\n${unsentMeme.caption ? unsentMeme.caption.replace(/[<>]/g, '') : ""}\n\n👁 ${unsentMeme.views} marta ko'rilgan`,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: `👍 ${unsentMeme.up.length}`, callback_data: `up_${unsentMeme._id}` },
                                { text: `👎 ${unsentMeme.down.length}`, callback_data: `down_${unsentMeme._id}` },
                            ],
                        ],
                    },
                });
            }
            catch (error) {
                console.error(`Failed to send meme to user ${user.telegram_id}:`, error);
            }
        }
        unsentMeme.sent = true;
        await unsentMeme.save();
        console.log(`Daily meme broadcast completed. Sent to ${users.length} users.`);
    }
    catch (error) {
        console.error("Error in daily meme broadcast:", error);
    }
});
bot.launch().then(() => console.log("bot is running 🚀"));
//# sourceMappingURL=index.js.map