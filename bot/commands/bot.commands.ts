import {
  etc_start,
  first_start,
  help_message,
} from "../../constants/messages.js";
import type { Context, Telegraf } from "telegraf";
import usersModel from "../../models/users.model.js";
import memeModel from "../../models/meme.model.js";

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
  bot.command("submit", async (ctx) => {
    await ctx.reply(
      "📸 Rasm yuboring va caption da mood ni ko'rsating.\n\n" +
        "Misol: 'happy meme' yoki 'sad story'\n\n" +
        "Mavjud moodlar: happy, sad, angry, sleepy, neutral",
      {
        parse_mode: "Markdown",
      }
    );
  });

  bot.on("photo", async (ctx) => {
    try {
      const bestPhoto = await ctx.message.photo.pop();
      const file = bestPhoto?.file_id;
      const caption = ctx.message.caption;

      let mood: string = "neutral";
      if (caption) {
        const moodMatch = caption
          .toLowerCase()
          .match(/(happy|sad|angry|sleepy|neutral)/);
        if (moodMatch && moodMatch[1]) {
          mood = moodMatch[1];
        }
      }

      const meme = new memeModel({
        image: file,
        caption: caption,
        views: 0,
        author: ctx.message.from.id,
        mood: mood,
        reactions: [
          {
            type: "smile",
            count: 0,
          },
        ],
      });

      await meme.save();

      await ctx.reply(
        `✅ Meme saqlandi!\n\n` +
          `🆔 \`${meme._id}\`\n` +
          `📸 ${meme.caption || "Mavjud emas!"}\n` +
          `😊 Mood: ${mood}`,
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
            { text: `👍 ${meme.up.length}`, callback_data: `up_${meme._id}` },
            {
              text: `👎 ${meme.down.length}`,
              callback_data: `down_${meme._id}`,
            },
          ],
        ],
      },
    });
  });
};

const battle = (bot: Telegraf<Context>) => {
  bot.command("battle", async (ctx) => {
    const memes = await memeModel.find({}).limit(50);
    if (memes.length < 2) {
      return await ctx.reply("⚔️ Yetarli meme yo'q!");
    }

    const shuffledMemes = memes.sort(() => Math.random() - 0.5);
    const meme1 = shuffledMemes[0];
    const meme2 = shuffledMemes[1];

    if (!meme1 || !meme2) {
      return await ctx.reply("⚔️ Yetarli meme yo'q!");
    }

    await ctx.replyWithPhoto(meme1.image, {
      caption:
        `⚔️ *Meme Battle!*\n\n` +
        `1️⃣ ${meme1.caption || "Meme 1"}\n` +
        `👍 ${meme1.up.length} | 👎 ${meme1.down.length}\n\n` +
        `2️⃣ ${meme2.caption || "Meme 2"}\n` +
        `👍 ${meme2.up.length} | 👎 ${meme2.down.length}\n\n` +
        `Kim g'olib bo'ladi?`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: `1️⃣`, callback_data: `battle_${meme1._id}_${meme2._id}` },
            { text: `2️⃣`, callback_data: `battle_${meme2._id}_${meme1._id}` },
          ],
        ],
      },
    });
  });
};

const mood = (bot: Telegraf<Context>) => {
  bot.command("mood", async (ctx) => {
    const moodStats = await memeModel.aggregate([
      { $match: { mood: { $exists: true, $ne: null } } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    let statsText = "";
    moodStats.forEach((stat: any) => {
      const emojiMap: { [key: string]: string } = {
        happy: "😄",
        sad: "😢",
        angry: "😡",
        sleepy: "😴",
        neutral: "😐",
      };
      const emoji = emojiMap[stat._id] || "😐";
      statsText += `${emoji} ${stat._id}: ${stat.count} ta\n`;
    });

    await ctx.reply(
      `😊 Qaysi kayfiyatda memes ko'rmoqchisiz?\n\n📊 *Mood statistikasi:*\n${statsText}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "😄 Happy", callback_data: "mood_happy" },
              { text: "😢 Sad", callback_data: "mood_sad" },
            ],
            [
              { text: "😡 Angry", callback_data: "mood_angry" },
              { text: "😴 Sleepy", callback_data: "mood_sleepy" },
            ],
          ],
        },
      }
    );
  });
};

const language = (bot: Telegraf<Context>) => {
  bot.command("language", async (ctx) => {
    await ctx.reply("🌍 Tilni tanlang:", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🇺🇿 O'zbek", callback_data: "lang_uz" },
            { text: "🇷🇺 Русский", callback_data: "lang_ru" },
            { text: "🇺🇸 English", callback_data: "lang_en" },
          ],
        ],
      },
    });
  });
};

const random = (bot: Telegraf<Context>) => {
  bot.command("random", async (ctx) => {
    const memes = await memeModel.find({}).limit(100);
    if (memes.length === 0) {
      return await ctx.reply("🎲 Meme topilmadi!");
    }

    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    if (!randomMeme) {
      return await ctx.reply("🎲 Meme topilmadi!");
    }

    await ctx.replyWithPhoto(randomMeme.image, {
      caption: `🎲 Tasodifiy meme:\n\n${randomMeme.caption || ""}\n\n👁 ${
        randomMeme.views
      } marta ko'rilgan`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `👍 ${randomMeme.up.length}`,
              callback_data: `up_${randomMeme._id}`,
            },
            {
              text: `👎 ${randomMeme.down.length}`,
              callback_data: `down_${randomMeme._id}`,
            },
          ],
          [{ text: `🎲 Yana tasodifiy`, callback_data: `random_meme` }],
        ],
      },
    });
  });
};

const top = (bot: Telegraf<Context>) => {
  bot.command("top", async (ctx) => {
    const topMemes = await memeModel
      .find({})
      .sort({ "up.length": -1 })
      .limit(10);

    if (topMemes.length === 0) {
      return await ctx.reply("🏆 Meme topilmadi!");
    }

    let message = "🏆 *TOP 10 MEMES*\n\n";
    const inlineKeyboard: any[] = [];

    topMemes.forEach((meme, index) => {
      message += `${index + 1}. 👍 ${meme.up.length} | 👎 ${
        meme.down.length
      }\n`;
      message += `${meme.caption || "Meme"}\n\n`;

      inlineKeyboard.push([
        { text: `${index + 1}. Ko'rish`, callback_data: `view_meme_${meme._id}` }
      ]);
    });

    inlineKeyboard.push([
      { text: "🔄 Yangilash", callback_data: "top_memes" }
    ]);

    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: inlineKeyboard
      },
    });
  });
};

const mymemes = (bot: Telegraf<Context>) => {
  bot.command("mymemes", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) {
      return await ctx.reply("❌ Foydalanuvchi topilmadi!");
    }

    const userMemes = await memeModel.find({ author: userId }).limit(10);

    if (userMemes.length === 0) {
      return await ctx.reply("😢 Sizda hali meme yo'q!");
    }

    let message = "🖼️ *Sizning memelaringiz:*\n\n";
    userMemes.forEach((meme, index) => {
      message += `${index + 1}. 👍 ${meme.up.length} | 👎 ${
        meme.down.length
      } | 👁 ${meme.views}\n`;
      message += `${meme.caption || "Meme"}\n\n`;
    });

    await ctx.reply(message, {
      parse_mode: "Markdown",
    });
  });
};

const streak = (bot: Telegraf<Context>) => {
  bot.command("streak", async (ctx) => {
    const user = await usersModel.findOne({ telegram_id: ctx.from?.id });
    if (!user) {
      return await ctx.reply("❌ Foydalanuvchi topilmadi!");
    }
    const now = new Date();
    const createdAt = new Date(user.createdAt);

    const diffDays = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );


    await ctx.reply(
      `🔥 *Sizning streak'ingiz:* ${diffDays}\n\n` +
        `Har kuni meme ko'rib, streak'ingizni oshiring!`,
      {
        parse_mode: "Markdown",
      }
    );
  });
};

const about = (bot: Telegraf<Context>) => {
  bot.command("about", async (ctx) => {
    await ctx.reply(
      `🤖 *MemeMaster Bot*\n\n` +
        `Versiya: 1.0.0\n` +
        `Til: TypeScript\n` +
        `Framework: Telegraf\n\n` +
        `Bu bot har kuni yangi memelar taqdim etadi va foydalanuvchilarga meme baholash imkoniyatini beradi.\n\n` +
        `📞 Admin: @use_ict`,
      {
        parse_mode: "Markdown",
      }
    );
  });
};

const report = (bot: Telegraf<Context>) => {
  bot.command("report", async (ctx) => {
    await ctx.reply(
      `🛠️ *Xatolik yuborish*\n\n` +
        `Agar botda xatolik yoki muammo ko'rsangiz, quyidagi ma'lumotlarni yuboring:\n\n` +
        `• Xatolik tavsifi\n` +
        `• Qaysi komanda ishlamayapti\n` +
        `• Screenshot (agar bo'lsa)\n\n` +
        `📧 Admin: @use_ict`,
      {
        parse_mode: "Markdown",
      }
    );
  });
};

export {
  help,
  start,
  getTgId,
  addMeme,
  daily,
  battle,
  mood,
  language,
  random,
  top,
  mymemes,
  streak,
  about,
  report,
};
