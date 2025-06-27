"use strict";
// src/index.ts - СТАБИЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// --- Импорты ---
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
// ВАЖНО: импортируем JsonValue напрямую, чтобы избежать ошибок
const client_1 = require("@prisma/client");
// --- Инициализация ---
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const botToken = process.env.BOT_TOKEN;
if (!botToken) {
    console.error("КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN не найден!");
    process.exit(1);
}
const bot = new telegraf_1.Telegraf(botToken);
// --- СТАРТОВОЕ МЕНЮ ---
bot.start((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const telegramUser = ctx.from;
        const userInDb = yield prisma.user.upsert({
            where: { telegram_id: telegramUser.id },
            update: { username: telegramUser.username, first_name: telegramUser.first_name },
            create: {
                telegram_id: telegramUser.id,
                username: telegramUser.username,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                language_code: telegramUser.language_code,
            },
        });
        console.log('Пользователь сохранен в БД:', userInDb.id);
        yield ctx.reply(`Привет, ${userInDb.first_name}! 🚀\n\nВыберите действие:`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' }],
                    [{ text: '👁 Посмотреть работы', callback_data: 'view_portfolio' }]
                ]
            }
        });
    }
    catch (error) {
        console.error('Ошибка в /start:', error);
        ctx.reply('Ой, что-то пошло не так. Попробуйте еще раз позже.');
    }
}));
// --- ОБРАБОТЧИКИ ГЛАВНОГО МЕНЮ ---
bot.action('view_portfolio', (ctx) => {
    ctx.reply(`📱 Наше портфолио: https://ваш-сайт.ru`, {
        reply_markup: { inline_keyboard: [[{ text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' }]] }
    });
});
bot.action('start_quiz', (ctx) => {
    ctx.reply(`⚖️ Даю согласие на обработку персональных данных.`, {
        reply_markup: { inline_keyboard: [[{ text: '✅ Согласен', callback_data: 'consent_agree' }]] }
    });
});
// --- ЛОГИКА КВИЗА ---
bot.action('consent_agree', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
        if (!user)
            throw new Error('Пользователь не найден');
        yield prisma.quizSession.create({
            data: {
                user_id: user.id,
                current_step: 1,
                answers: {}, // Используем пустой объект
            }
        });
        yield sendQuestion1(ctx);
    }
    catch (error) {
        console.error('Ошибка при создании сессии квиза:', error);
    }
}));
// УНИВЕРСАЛЬНАЯ ФУНКЦИЯ СОХРАНЕНИЯ
function saveAnswerAndNext(ctx, field, value, nextFunction) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
            if (!user)
                throw new Error('Пользователь не найден');
            const session = yield prisma.quizSession.findFirst({
                where: { user_id: user.id, is_completed: false },
                orderBy: { created_at: 'desc' }
            });
            if (!session)
                throw new Error('Активная сессия не найдена');
            const currentAnswers = session.answers || {};
            const updatedAnswers = Object.assign(Object.assign({}, currentAnswers), { [field]: value });
            yield prisma.quizSession.update({
                where: { id: session.id },
                data: {
                    answers: updatedAnswers,
                    current_step: (session.current_step || 0) + 1,
                }
            });
            yield nextFunction(ctx);
        }
        catch (error) {
            console.error('Ошибка при сохранении ответа:', error);
        }
    });
}
// --- Вопросы ---
function sendQuestion1(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply(`❓ 1/3: Какой сайт вам нужен?`, {
            reply_markup: { inline_keyboard: [[{ text: '📄 Лендинг', callback_data: 'q1_landing' }], [{ text: '🛒 Магазин', callback_data: 'q1_shop' }]] }
        });
    });
}
bot.action('q1_landing', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Лендинг', sendQuestion2));
bot.action('q1_shop', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Магазин', sendQuestion2));
function sendQuestion2(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply(`❓ 2/3: В какой нише работаете?`, {
            reply_markup: { inline_keyboard: [[{ text: '⚙️ Услуги', callback_data: 'q2_services' }], [{ text: '✏️ Другое', callback_data: 'q2_other' }]] }
        });
    });
}
bot.action('q2_services', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Услуги', sendQuestion3));
bot.action('q2_other', (ctx) => ctx.reply('✏️ Напишите вашу нишу текстом:'));
function sendQuestion3(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply(`❓ 3/3: Как с вами связаться?\n\n📛 Напишите ваше имя:`);
    });
}
// ОБРАБОТКА ТЕКСТА
bot.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
        if (!user)
            return;
        const session = yield prisma.quizSession.findFirst({
            where: { user_id: user.id, is_completed: false },
            orderBy: { created_at: 'desc' }
        });
        if (!session || !('text' in ctx.message))
            return;
        const currentAnswers = session.answers || {};
        // Ответ на вопрос о нише "Другое"
        if (session.current_step === 2 && !currentAnswers.niche) {
            yield saveAnswerAndNext(ctx, 'niche', ctx.message.text, sendQuestion3);
            return;
        }
        // Сбор контактов
        if (session.current_step === 3) {
            if (!currentAnswers.contacts) {
                currentAnswers.contacts = { name: ctx.message.text };
                yield prisma.quizSession.update({ where: { id: session.id }, data: { answers: currentAnswers } });
                yield ctx.reply('📱 Теперь напишите ваш телефон:');
            }
            else if (!currentAnswers.contacts.phone) {
                currentAnswers.contacts.phone = ctx.message.text;
                // Завершение квиза и создание заявки
                yield prisma.quizSession.update({ where: { id: session.id }, data: { answers: currentAnswers, is_completed: true } });
                yield prisma.application.create({
                    data: {
                        user_id: user.id,
                        status: 'new',
                        answers: currentAnswers,
                        contact_info: `${currentAnswers.contacts.name}, ${currentAnswers.contacts.phone}`,
                    }
                });
                console.log('Квиз завершен, заявка создана');
                yield ctx.reply(`🎉 Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.`);
            }
        }
    }
    catch (error) {
        console.error('Ошибка при обработке текста:', error);
    }
}));
// --- ЗАПУСК БОТА ---
bot.launch();
console.log('✅ Бот успешно запущен!');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
