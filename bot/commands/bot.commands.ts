import {
  etc_start,
  first_start,
  help_message,
} from "../../constants/messages.js";
import type { Context, Telegraf } from "telegraf";
import usersModel from "../../models/users.model.js";
import memeModel from "../../models/meme.model.js";
import type mongoose from "mongoose";

const start = (bot: Telegraf<Context>) => {
  bot.command("start", async (ctx) => {
    const user = await usersModel.findOne({ telegram_id: ctx.from?.id });
    if (user) {
      ctx.reply(etc_start(ctx), {
        parse_mode: "HTML",
      });
    } else {
      const user = new usersModel({
        telegram_id: ctx.message.from.id,
        username: ctx.message.from.username,
        first_name: ctx.message.from.first_name,
        last_name: ctx.message.from.last_name,
      });

      await user.save();

      ctx.reply(first_start(ctx), {
        parse_mode: "HTML",
      });
    }
  });
};

const help = (bot: Telegraf<Context>) => {
  bot.command("help", (ctx) => {
    ctx.reply(help_message(ctx), {
      parse_mode: "HTML",
    });
  });
};

const getTgId = (bot: Telegraf<Context>) => {
  bot.command("gimme", (ctx) => {
    ctx.reply(`📬 *Sening Telegram ID'ing:* \`${ctx.message.from.id}\``, {
      parse_mode: "Markdown",
    });
  });
};

const addMeme = (bot: Telegraf<Context>) => {
  const ADMINS = process.env.ADMINS;
  bot.command("addmeme", async (ctx) => {
    if (!ADMINS?.includes(ctx.message.from.id.toString()))
      return await ctx.reply("🚫 Sizda memelar qo‘shish huquqi yo‘q!");

    await ctx.reply("📸 Rasm yuboring (caption bilan hohlasangiz).");
  });

  bot.on("photo", async (ctx) => {
    if (!ADMINS?.includes(ctx.message.from.id.toString()))
      return await ctx.reply("🚫 Sizda memelar qo‘shish huquqi yo‘q!");

    try {
      const bestPhoto = await ctx.message.photo.pop();
      const file = await ctx.telegram.getFileLink(bestPhoto?.file_id as string);
      const caption = ctx.message.caption;

      const meme = new memeModel({
        image: file,
        caption: caption,
        views: 0,
        author: ctx.message.from.id,
        up: 0,
        down: 0,
        reactions: [
          {
            type: "smile",
            count: 0,
          },
        ],
      });

      await meme.save();

      await ctx.reply(
        `✅ Meme saqlandi!\n\n🆔 \`${meme._id}\`\n📸 ${
          meme.caption || "Mavjud emas!"
        }`,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error(error);
      await ctx.reply("❌ Xato yuz berdi, keyinroq urinib ko‘ring.");
      throw new Error("Failed to add meme!");
    }
  });
};

const daily = (bot: Telegraf<Context>) => {
  bot.command("daily", async (ctx) => {
    const user = await usersModel.findOne({
      telegram_id: ctx.from?.id,
    });

    if (!user) {
      return await ctx.reply("❌ Foydalanuvchi topilmadi!");
    }

    const unseenMemes = await memeModel
      .find({
        _id: {
          $nin: user.viewed_memes,
        },
      })
      .limit(10);

    if (unseenMemes.length === 0) {
      return await ctx.reply("😢 Hozircha yangi memelar yo‘q!");
    }

    let meme = unseenMemes[Math.floor(Math.random() * unseenMemes.length)];

    if (!meme || !meme.image) {
      return await ctx.reply("❌ Meme topilmadi!");
    }

    if (typeof meme.views === "number") {
      meme.views += 1;
      await meme.save();
    }

    if (user.viewed_memes) {
      user.viewed_memes.push(meme._id);
      await user.save();
    }

    await ctx.replyWithPhoto(meme.image, {
      caption: `🧠 ${meme.caption || ""}\n\n👁 ${meme.views} marta ko‘rildi`,
      reply_markup: {
        inline_keyboard: [
          [
            { text: `👍 ${meme.up}`, callback_data: `up_${meme._id}` },
            { text: `👎 ${meme.down}`, callback_data: `down_${meme._id}` },
          ],
        ],
      },
    });
  });
};

export { help, start, getTgId, addMeme };
