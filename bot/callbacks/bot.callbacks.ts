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

      const action = ctx.match[1] as "up" | "down";
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
        const updatedMeme = await memeModel.findById(memeId);
        if (updatedMeme) {
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
            if (!editError.message?.includes("message is not modified")) {
              console.warn("Could not update inline keyboard:", editError);
            }
          }
        }
        return await ctx.answerCbQuery(MESSAGES.LIKE_REMOVED);
      } else if (isDownvoted) {
        updateQuery.$pull = { down: userId };
        await memeModel.findByIdAndUpdate(memeId, updateQuery);
        const updatedMeme = await memeModel.findById(memeId);
        if (updatedMeme) {
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
            if (!editError.message?.includes("message is not modified")) {
              console.warn("Could not update inline keyboard:", editError);
            }
          }
        }
        return await ctx.answerCbQuery(MESSAGES.DISLIKE_REMOVED);
      }

      if (action === "up") {
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
              {
                text: `👍 ${updatedMeme.up.length}`,
                callback_data: `up_${memeId}`,
              },
              {
                text: `👎 ${updatedMeme.down.length}`,
                callback_data: `down_${memeId}`,
              },
            ],
          ],
        });
      } catch (editError: any) {
        if (!editError.message?.includes("message is not modified")) {
          console.warn("Could not update inline keyboard:", editError);
        }
      }

      await ctx.answerCbQuery(
        action === "up" ? MESSAGES.LIKE_ADDED : MESSAGES.DISLIKE_ADDED
      );
    } catch (error) {
      console.error("Error in upDownCallback:", error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });
};

const battleCallback = (bot: Telegraf<Context>) => {
  bot.action(/^battle_(.+)_(.+)$/, async (ctx) => {
    try {
      const [meme1Id, meme2Id] = ctx.match.slice(1, 3);

      if (
        !meme1Id ||
        !meme2Id ||
        !/^[a-f\d]{24}$/i.test(meme1Id) ||
        !/^[a-f\d]{24}$/i.test(meme2Id)
      ) {
        return await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
      }

      const [meme1, meme2] = await Promise.all([
        memeModel.findById(meme1Id),
        memeModel.findById(meme2Id),
      ]);

      if (!meme1 || !meme2) {
        return await ctx.answerCbQuery(MESSAGES.MEME_NOT_FOUND);
      }

      const winner = Math.random() > 0.5 ? meme1 : meme2;
      const loser = winner === meme1 ? meme2 : meme1;

      await ctx.editMessageCaption(
        `🏆 <b>G'olib:</b> ${winner.caption || "Meme"}\n\n` +
          `👍 ${winner.up.length} | 👎 ${winner.down.length}\n\n` +
          `💔 <b>Mag'lub:</b> ${loser.caption || "Meme"}\n\n` +
          `👍 ${loser.up.length} | 👎 ${loser.down.length}`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: `🔄 Yangi Battle`, callback_data: `new_battle` }],
            ],
          },
        }
      );

      await ctx.answerCbQuery("⚔️ Jang tugadi!");
    } catch (error) {
      console.error("Error in battleCallback:", error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });

  bot.action("new_battle", async (ctx) => {
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

      await ctx.replyWithPhoto(meme1.image, {
        caption: `1️⃣ ${meme1.caption || "Meme 1"}\n👍 ${meme1.up.length} | 👎 ${meme1.down.length}`,
        parse_mode: "HTML",
      });

      await ctx.replyWithPhoto(meme2.image, {
        caption: `2️⃣ ${meme2.caption || "Meme 2"}\n👍 ${meme2.up.length} | 👎 ${meme2.down.length}`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `1️⃣`,
                callback_data: `battle_${meme1._id}_${meme2._id}`,
              },
              {
                text: `2️⃣`,
                callback_data: `battle_${meme2._id}_${meme1._id}`,
              },
            ],
          ],
        },
      });

      await ctx.answerCbQuery("⚔️ Jang boshlandi!");
    } catch (error) {
      console.error("Error in new_battle:", error);
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

      const mood = ctx.match[1] || "happy";
      const userId = ctx.from?.id;

      if (!userId) {
        return await ctx.answerCbQuery("Foydalanuvchi topilmadi!");
      }

      const user = await usersModel.findOne({ telegram_id: userId });
      const viewedMemes = user?.viewed_memes || [];

      const memes = await memeModel
        .find({
          mood: mood,
          _id: { $nin: viewedMemes }
        })
        .limit(10);

      if (memes.length === 0) {
        return await ctx.answerCbQuery(`😔 ${mood} kayfiyati uchun yangi meme topilmadi!`);
      }

      // Create numbered list of memes
      let message = `😊 <b>${mood.toUpperCase()}</b> kayfiyati uchun memelar:\n\n`;
      const inlineKeyboard: any[] = [];

      memes.forEach((meme, index) => {
        message += `${index + 1}. 👍 ${meme.up.length} | 👎 ${meme.down.length}\n`;
        message += `${meme.caption ? meme.caption.replace(/[<>]/g, '') : "Meme"}\n\n`;

        inlineKeyboard.push([
          { text: `${index + 1}`, callback_data: `mood_meme_${mood}_${index}` }
        ]);
      });

      inlineKeyboard.push([
        { text: `🔄 Boshqa kayfiyat`, callback_data: `change_mood` }
      ]);

      try {
        await ctx.editMessageCaption(message, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: inlineKeyboard
          },
        });
      } catch (editError: any) {
        if (editError.message?.includes("there is no caption")) {
          await ctx.editMessageText(message, {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: inlineKeyboard
            },
          });
        } else {
          console.warn("Could not update message:", editError);
        }
      }

      await ctx.answerCbQuery(`😊 ${mood} kayfiyati uchun memelar ro'yxati!`);
    } catch (error) {
      console.error("Error in moodCallback:", error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });

  // Handle mood meme selection
  bot.action(/^mood_meme_(.+)_(\d+)$/, async (ctx) => {
    try {
      if (!ctx.match) {
        return await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
      }

      const mood = ctx.match[1] || "happy";
      const indexStr = ctx.match[2];
      const index = indexStr ? parseInt(indexStr) : 0;
      const userId = ctx.from?.id;

      if (!userId) {
        return await ctx.answerCbQuery("Foydalanuvchi topilmadi!");
      }

      const user = await usersModel.findOne({ telegram_id: userId });
      const viewedMemes = user?.viewed_memes || [];

      const memes = await memeModel
        .find({
          mood: mood,
          _id: { $nin: viewedMemes }
        })
        .limit(10);

      if (index >= memes.length || index < 0) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      const selectedMeme = memes[index];
      if (!selectedMeme) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      // Mark as viewed
      if (user && user.viewed_memes) {
        user.viewed_memes.push(selectedMeme._id);
        await user.save();
      }

      // Increment views
      if (typeof selectedMeme.views === "number") {
        selectedMeme.views += 1;
        await selectedMeme.save();
      }

      // Send the meme
      await ctx.replyWithPhoto(selectedMeme.image, {
        caption: `😊 <b>${mood.toUpperCase()}</b> kayfiyati uchun meme:\n\n${selectedMeme.caption ? selectedMeme.caption.replace(/[<>]/g, '') : ""}\n\n👁 ${selectedMeme.views} marta ko'rilgan`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: `👍 ${selectedMeme.up.length}`, callback_data: `up_${selectedMeme._id}` },
              { text: `👎 ${selectedMeme.down.length}`, callback_data: `down_${selectedMeme._id}` },
            ],
            [
              { text: `🎭 Boshqa ${mood}`, callback_data: `mood_${mood}` },
              { text: `🔄 Boshqa kayfiyat`, callback_data: `change_mood` }
            ],
          ],
        },
      });

      await ctx.answerCbQuery(`😊 ${mood} kayfiyati uchun meme yuborildi!`);
    } catch (error) {
      console.error("Error in mood_meme callback:", error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });

  bot.action('change_mood', async (ctx) => {
    try {
      await ctx.editMessageText("😊 Qaysi kayfiyatda memes ko'rmoqchisiz?", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "😄 Happy", callback_data: "mood_happy" },
              { text: "😢 Sad", callback_data: "mood_sad" }
            ],
            [
              { text: "😡 Angry", callback_data: "mood_angry" },
              { text: "😴 Sleepy", callback_data: "mood_sleepy" }
            ]
          ]
        }
      });

      await ctx.answerCbQuery("Kayfiyat tanlandi!");
    } catch (error) {
      console.error('Error in change_mood:', error);
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
        en: "English",
      };

      await ctx.editMessageText(
        `🌍 Til ${
          langNames[lang as keyof typeof langNames] || lang
        }ga o'zgartirildi!\n\n` +
          `Til o'zgarishi keyingi xabarlardan boshlab amal qiladi.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🇺🇿 O'zbek", callback_data: "lang_uz" },
                { text: "🇷🇺 Русский", callback_data: "lang_ru" },
                { text: "🇺🇸 English", callback_data: "lang_en" },
              ],
            ],
          },
        }
      );

      await ctx.answerCbQuery(
        `🌍 Til ${
          langNames[lang as keyof typeof langNames] || lang
        }ga o'zgartirildi!`
      );
    } catch (error) {
      console.error("Error in languageCallback:", error);
      await ctx.answerCbQuery("Til o'zgartirishda xatolik!");
    }
  });
};

const randomCallback = (bot: Telegraf<Context>) => {
  bot.action("random_meme", async (ctx) => {
    try {
      const memes = await memeModel.find({}).limit(100);
      if (memes.length === 0) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      const randomMeme = memes[Math.floor(Math.random() * memes.length)];
      if (!randomMeme) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      try {
        await ctx.editMessageCaption(
          `🎲 Tasodifiy meme:\n\n${randomMeme.caption ? randomMeme.caption.replace(/[<>]/g, '') : ""}\n\n👁 ${
            randomMeme.views
          } marta ko'rilgan`,
          {
            parse_mode: "HTML",
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
          }
        );
      } catch (editError: any) {
        if (editError.message?.includes("there is no caption")) {
          await ctx.editMessageText(
            `🎲 Tasodifiy meme:\n\n${randomMeme.caption ? randomMeme.caption.replace(/[<>]/g, '') : ""}\n\n👁 ${
              randomMeme.views
            } marta ko'rilgan`,
            {
              parse_mode: "HTML",
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
            }
          );
        } else if (!editError.message?.includes("message is not modified")) {
          console.warn("Could not update random meme:", editError);
        }
      }

      await ctx.answerCbQuery("🎲 Tasodifiy meme!");
    } catch (error) {
      console.error("Error in randomCallback:", error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });
};

const topMemesCallback = (bot: Telegraf<Context>) => {
  bot.action("top_memes", async (ctx) => {
    try {
      const topMemes = await memeModel
        .find({})
        .sort({ "up.length": -1 })
        .limit(10);

      if (topMemes.length === 0) {
        return await ctx.answerCbQuery("Meme topilmadi!");
      }

      let message = "🏆 <b>TOP 10 MEMES</b>\n\n";
      const inlineKeyboard: any[] = [];

      topMemes.forEach((meme, index) => {
        message += `${index + 1}. 👍 ${meme.up.length} | 👎 ${
          meme.down.length
        }\n`;
        message += `${meme.caption ? meme.caption.replace(/[<>]/g, '') : "Meme"}\n\n`;

        inlineKeyboard.push([
          { text: `${index + 1}. Ko'rish`, callback_data: `view_meme_${meme._id}` }
        ]);
      });

      inlineKeyboard.push([
        { text: "🔄 Yangilash", callback_data: "top_memes" }
      ]);

      try {
        await ctx.editMessageText(message, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: inlineKeyboard
          },
        });
      } catch (editError: any) {
        if (!editError.message?.includes("message is not modified")) {
          console.warn("Could not update top memes:", editError);
        }
      }

      await ctx.answerCbQuery("🏆 Top memes!");
    } catch (error) {
      console.error("Error in topMemesCallback:", error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });

  bot.action(/^view_meme_(.+)$/, async (ctx) => {
    try {
      const memeId = ctx.match[1];

      if (!memeId || !/^[a-f\d]{24}$/i.test(memeId)) {
        return await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
      }

      const meme = await memeModel.findById(memeId);
      if (!meme) {
        return await ctx.answerCbQuery(MESSAGES.MEME_NOT_FOUND);
      }

      const userId = ctx.from?.id;
      if (userId) {
        const user = await usersModel.findOne({ telegram_id: userId });
        if (user && user.viewed_memes) {
          user.viewed_memes.push(meme._id);
          await user.save();
        }
      }

      if (typeof meme.views === "number") {
        meme.views += 1;
        await meme.save();
      }

      await ctx.replyWithPhoto(meme.image, {
        caption: `🏆 <b>Top Meme</b>\n\n${meme.caption ? meme.caption.replace(/[<>]/g, '') : ""}\n\n👁 ${meme.views} marta ko'rilgan`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: `👍 ${meme.up.length}`, callback_data: `up_${meme._id}` },
              { text: `👎 ${meme.down.length}`, callback_data: `down_${meme._id}` }
            ]
          ]
        }
      });

      await ctx.answerCbQuery("Meme yuborildi!");
    } catch (error) {
      console.error("Error in view_meme:", error);
      await ctx.answerCbQuery(MESSAGES.VOTE_ERROR);
    }
  });
};

export {
  upDownCallback,
  battleCallback,
  moodCallback,
  languageCallback,
  randomCallback,
  topMemesCallback,
};
