import type { Context } from "telegraf";

export const MESSAGES = {
  MEME_NOT_FOUND: "❌ Meme topilmadi!",
  LIKE_ADDED: "👍 Like qo‘shildi!",
  DISLIKE_ADDED: "👎 Dislike qo‘shildi!",
  LIKE_REMOVED: "👍 Like olib tashlandi!",
  DISLIKE_REMOVED: "👎 Dislike olib tashlandi!",
  VOTE_ERROR: "❌ Ovoz berishda xatolik yuz berdi!",
};

const help_message = (ctx: Context) => `
<b>🤖 MemeMaster Help Center</b>

Salom <b>${ctx.from?.first_name || "do'stim"}</b>! 😎
Men senga har kuni eng 🔥 memelarni olib kelaman.

Quyidagi komandalarni ishlatishing mumkin:

<b>🧩 Asosiy komandalar:</b>
/start — Botni boshlash yoki qayta ishga tushirish  
/help — Shu yordam oynasini ko‘rsatish  
/daily — Bugungi “Daily Meme”ni olish  
/random — Tasodifiy memeni yuborish  
/mymemes — O‘zing yuborgan memelarni ko‘rish  
/top — Eng ko‘p yoqtirilgan memelar ro‘yxati  

<b>🎮 Funksiyalar:</b>
/battle — Ikki memeni solishtirib, ovoz berish 🔥  
/submit — O‘z memeingni yuborish 😎  
/mood — Kayfiyat tanlab, shunga mos meme olish 😁😡😴  
/streak — Necha kundan beri memelarni ko‘rib kelayotganingni bilish  

<b>⚙️ Foydali:</b>
/language — Tilni o‘zgartirish 🌍  
/about — Bot haqida ma’lumot ℹ️  
/report — Xatolik yoki shikoyat yuborish 🛠️  

<b>💡 Maslahat:</b>
Memeni yoqtirsang ❤️ bos, yoki do‘stlaring bilan ulash.  
Eng faol foydalanuvchilar “Meme King 👑” ro‘yxatiga chiqadi!

Stay funny, stay memed 😂
`;

const etc_start = (ctx: Context) =>
  `👋 <b>Yana salom, ${
    ctx.message?.from.first_name || ctx.message?.from.last_name || "do'stim"
  }!</b>\n\n` +
  `Siz allaqachon bizning meme oilamizdasiz 😎\n` +
  `Bugundan boshlab sizga yana 🔥 <b>Daily Meme</b> yuborish tiklandi!\n\n` +
  `Agar xohlasangiz hozir /daily ni bosing va memeni oling 😂`;

const first_start = (ctx: Context) =>
  `👋 <b>Salom, ${ctx.message?.from.first_name || "do'stim"}!</b>\n\n` +
  `Memelar olamiga xush kelibsiz! 🎉\n\n` +
  `Bugundan boshlab sizga har kuni 🔥 <b>Daily Meme</b> yuboriladi!\n\n` +
  `Boshlash uchun /daily buyrug‘ini bosib ko‘r yoki /help orqali boshqa komandalarni bilib ol 😎`;

export { help_message, etc_start, first_start };
