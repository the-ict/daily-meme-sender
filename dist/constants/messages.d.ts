import type { Context } from "telegraf";
export declare const MESSAGES: {
    MEME_NOT_FOUND: string;
    LIKE_ADDED: string;
    DISLIKE_ADDED: string;
    LIKE_REMOVED: string;
    DISLIKE_REMOVED: string;
    VOTE_ERROR: string;
};
declare const help_message: (ctx: Context) => string;
declare const etc_start: (ctx: Context) => string;
declare const first_start: (ctx: Context) => string;
export { help_message, etc_start, first_start };
//# sourceMappingURL=messages.d.ts.map