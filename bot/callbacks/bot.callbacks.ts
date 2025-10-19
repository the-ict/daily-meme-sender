import { Telegraf, Context } from "telegraf";
import memeModel from "../../models/meme.model.js";
import usersModel from "../../models/users.model.js";
import { MESSAGES } from "../../constants/messages.js";

const upDownCallback = (bot: Telegraf<Context>) => {
  bot.action(/^(up|down)_(.+)$/, async (ctx) => {
    try {
      if (!ctx.match || !ctx.from) {
        return await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
      }

      const action = ctx.match[1] as 'up' | 'down';
      const memeId = ctx.match[2];
      const userId = ctx.from.id;

      if (!memeId || !/^[a-f\d]{24}$/i.test(memeId)) {
        return await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
      }

      const meme = await memeModel.findById(memeId);
      if (!meme) {
        return await ctx.answerCbQuery(MESSAGES.MEME_NOT_FOUND);
      }

      const isUpvoted = meme.up.includes(userId);
      const isDownvoted = meme.down.includes(userId);

      const updateQuery: any = {};

      if (isUpvoted) {
        updateQuery.$pull = { up: userId };
        await memeModel.findByIdAndUpdate(memeId, updateQuery);
        return await ctx.answerCbQuery(MESSAGES.LIKE_REMOVED);
      } else if (isDownvoted) {
        updateQuery.$pull = { down: userId };
        await memeModel.findByIdAndUpdate(memeId, updateQuery);
        return await ctx.answerCbQuery(MESSAGES.DISLIKE_REMOVED);
      }

      if (action === 'up') {
        updateQuery.$addToSet = { up: userId };
        updateQuery.$pull = { down: userId }; 
      } else {
        updateQuery.$addToSet = { down: userId };
        updateQuery.$pull = { up: userId }; 
      }

      await memeModel.findByIdAndUpdate(memeId, updateQuery);

      const updatedMeme = await memeModel.findById(memeId);
      if (!updatedMeme) {
        return await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
      }

      try {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: [
            [
              { text: `👍 ${updatedMeme.up.length}`, callback_data: `up_${memeId}` },
              { text: `👎 ${updatedMeme.down.length}`, callback_data: `down_${memeId}` },
            ],
          ],
        });
      } catch (editError: any) {
        if (!editError.message?.includes('message is not modified')) {
          console.warn('Could not update inline keyboard:', editError);
        }
      }

      await ctx.answerCbQuery(
        action === 'up' ? MESSAGES.LIKE_ADDED : MESSAGES.DISLIKE_ADDED
      );
    } catch (error) {
      console.error('Error in upDownCallback:', error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });
};

const battleCallback = (bot: Telegraf<Context>) => {
  bot.action(/^battle_(.+)_(.+)$/, async (ctx) => {
    try {
      const [meme1Id, meme2Id] = ctx.match.slice(1, 3);

      if (!meme1Id || !meme2Id || !/^[a-f\d]{24}$/i.test(meme1Id) || !/^[a-f\d]{24}$/i.test(meme2Id)) {
        return await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
      }

      const [meme1, meme2] = await Promise.all([
        memeModel.findById(meme1Id),
        memeModel.findById(meme2Id)
      ]);

      if (!meme1 || !meme2) {
        return await ctx.answerCbQuery(MESSAGES.MEME_NOT_FOUND);
      }

      const winner = Math.random() > 0.5 ? meme1 : meme2;
      const loser = winner === meme1 ? meme2 : meme1;

      await ctx.editMessageCaption(
        `🏆 *G'olib:* ${winner.caption || 'Meme'}\n\n` +
        `👍 ${winner.up.length} | 👎 ${winner.down.length}\n\n` +
        `💔 *Mag'lub:* ${loser.caption || 'Meme'}\n\n` +
        `👍 ${loser.up.length} | 👎 ${loser.down.length}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: `🔄 Yangi Battle`, callback_data: `new_battle` }
              ]
            ]
          }
        }
      );

      await ctx.answerCbQuery("⚔️ Jang tugadi!");
    } catch (error) {
      console.error('Error in battleCallback:', error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });

  bot.action('new_battle', async (ctx) => {
    try {
      const memes = await memeModel.find({}).limit(50);
      if (memes.length < 2) {
        return await ctx.answerCbQuery("Yetarli meme yo'q!");
      }

      const shuffledMemes = memes.sort(() => Math.random() - 0.5);
      const meme1 = shuffledMemes[0];
      const meme2 = shuffledMemes[1];

      if (!meme1 || !meme2) {
        return await ctx.answerCbQuery("Yetarli meme yo'q!");
      }

      await ctx.editMessageCaption(
        `⚔️ *Meme Battle!*\n\n` +
        `1️⃣ ${meme1.caption || 'Meme 1'}\n` +
        `👍 ${meme1.up.length} | 👎 ${meme1.down.length}\n\n` +
        `2️⃣ ${meme2.caption || 'Meme 2'}\n` +
        `👍 ${meme2.up.length} | 👎 ${meme2.down.length}\n\n` +
        `Kim g'olib bo'ladi?`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: `1️⃣`, callback_data: `battle_${meme1._id}_${meme2._id}` },
                { text: `2️⃣`, callback_data: `battle_${meme2._id}_${meme1._id}` }
              ]
            ]
          }
        }
      );

      await ctx.answerCbQuery("⚔️ Jang boshlandi!");
    } catch (error) {
      console.error('Error in new_battle:', error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });
};

const moodCallback = (bot: Telegraf<Context>) => {
  bot.action(/^mood_(.+)$/, async (ctx) => {
    try {
      if (!ctx.match) {
        return await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
      }

      const mood = ctx.match[1] || 'happy';
      const moods = {
        happy: ['funny', 'cute', 'positive'],
        sad: ['emotional', 'dark', 'melancholy'],
        angry: ['sarcastic', 'rage', 'intense'],
        sleepy: ['relaxing', 'calm', 'chill']
      };

      const moodKeywords = moods[mood as keyof typeof moods] || [];
      const memes = await memeModel.find({
        $or: [
          { caption: { $regex: moodKeywords.join('|'), $options: 'i' } },
          { reactions: { $elemMatch: { type: { $in: moodKeywords } } } }
        ]
      }).limit(10);

      if (memes.length === 0) {
        return await ctx.answerCbQuery("Bu kayfiyat uchun meme topilmadi!");
      }

      const randomMeme = memes[Math.floor(Math.random() * memes.length)];
      if (!randomMeme) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      await ctx.editMessageCaption(
        `😊 *${mood.toUpperCase()}* kayfiyati uchun meme:\n\n${randomMeme.caption || ''}`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: `👍 ${randomMeme.up.length}`, callback_data: `up_${randomMeme._id}` },
                { text: `👎 ${randomMeme.down.length}`, callback_data: `down_${randomMeme._id}` }
              ],
              [
                { text: `🎭 Boshqa ${mood}`, callback_data: `mood_${mood}` }
              ]
            ]
          }
        }
      );

      await ctx.answerCbQuery(`😊 ${mood} kayfiyati uchun meme!`);
    } catch (error) {
      console.error('Error in moodCallback:', error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });
};

const languageCallback = (bot: Telegraf<Context>) => {
  bot.action(/^lang_(.+)$/, async (ctx) => {
    try {
      if (!ctx.match) {
        return await ctx.answerCbQuery("Xatolik yuz berdi!");
      }

      const lang = ctx.match[1];
      const userId = ctx.from?.id;

      if (!userId) {
        return await ctx.answerCbQuery("Foydalanuvchi topilmadi!");
      }

      await usersModel.findOneAndUpdate(
        { telegram_id: userId },
        { language: lang },
        { upsert: true }
      );

      const langNames = {
        uz: "O'zbek",
        ru: "Русский",
        en: "English"
      };

      await ctx.editMessageText(
        `🌍 Til ${langNames[lang as keyof typeof langNames] || lang}ga o'zgartirildi!\n\n` +
        `Til o'zgarishi keyingi xabarlardan boshlab amal qiladi.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🇺🇿 O'zbek", callback_data: "lang_uz" },
                { text: "🇷🇺 Русский", callback_data: "lang_ru" },
                { text: "🇺🇸 English", callback_data: "lang_en" }
              ]
            ]
          }
        }
      );

      await ctx.answerCbQuery(`🌍 Til ${langNames[lang as keyof typeof langNames] || lang}ga o'zgartirildi!`);
    } catch (error) {
      console.error('Error in languageCallback:', error);
      await ctx.answerCbQuery("Til o'zgartirishda xatolik!");
    }
  });
};

const randomCallback = (bot: Telegraf<Context>) => {
  bot.action('random_meme', async (ctx) => {
    try {
      const memes = await memeModel.find({}).limit(100);
      if (memes.length === 0) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      const randomMeme = memes[Math.floor(Math.random() * memes.length)];
      if (!randomMeme) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      await ctx.editMessageCaption(
        `🎲 Tasodifiy meme:\n\n${randomMeme.caption || ''}\n\n👁 ${randomMeme.views} marta ko'rilgan`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: `👍 ${randomMeme.up.length}`, callback_data: `up_${randomMeme._id}` },
                { text: `👎 ${randomMeme.down.length}`, callback_data: `down_${randomMeme._id}` }
              ],
              [
                { text: `🎲 Yana tasodifiy`, callback_data: `random_meme` }
              ]
            ]
          }
        }
      );

      await ctx.answerCbQuery("🎲 Tasodifiy meme!");
    } catch (error) {
      console.error('Error in randomCallback:', error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });
};

const topMemesCallback = (bot: Telegraf<Context>) => {
  bot.action('top_memes', async (ctx) => {
    try {
      const topMemes = await memeModel.find({})
        .sort({ 'up.length': -1 })
        .limit(10);

      if (topMemes.length === 0) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      let message = "🏆 *TOP 10 MEMES*\n\n";
      topMemes.forEach((meme, index) => {
        message += `${index + 1}. 👍 ${meme.up.length} | 👎 ${meme.down.length}\n`;
        message += `${meme.caption || 'Meme'}\n\n`;
      });

      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔄 Yangilash", callback_data: "top_memes" }
            ]
          ]
        }
      });

      await ctx.answerCbQuery("🏆 Top memes!");
    } catch (error) {
      console.error('Error in topMemesCallback:', error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });
};

export { upDownCallback, battleCallback, moodCallback, languageCallback, randomCallback, topMemesCallback };
