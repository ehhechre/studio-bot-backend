"use strict";
// src/index.ts - Финальная версия: Улучшенный квиз, согласие, удаление данных, отправка в канал
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
const client_1 = require("@prisma/client");
// --- Инициализация ---
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const botToken = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
if (!botToken || !CHANNEL_ID) {
    console.error("КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN или CHANNEL_ID не найдены в .env!");
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
        yield ctx.reply('Ой, что-то пошло не так. Попробуйте еще раз позже.');
    }
}));
// --- ОБРАБОТЧИКИ ГЛАВНОГО МЕНЮ ---
bot.action('view_portfolio', (ctx) => {
    ctx.reply(`📱 Наше портфолио: https://ваш-сайт.ru`, {
        reply_markup: { inline_keyboard: [[{ text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' }]] }
    });
});
bot.action('start_quiz', (ctx) => {
    ctx.reply(`📋 СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ\n\n` +
        `Я даю согласие на обработку моих персональных данных (имя, телефон, Telegram ID) с целью предоставления услуг веб-разработки и связи со мной. Срок хранения данных - 3 года.\n\n` +
        `Я могу отозвать согласие в любой момент командой /delete_data.`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ Согласен', callback_data: 'consent_agree' }],
                [{ text: '❌ Не согласен', callback_data: 'consent_decline' }]
            ]
        }
    });
});
bot.action('consent_decline', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply(`❌ Понял вас. Без согласия мы не можем начать опрос.\n\nЕсли передумаете - нажмите /start`);
}));
// --- ЛОГИКА КВИЗА ---
bot.action('consent_agree', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
        if (!user)
            throw new Error('Пользователь не найден');
        // Удаляем старые незавершенные сессии этого пользователя
        yield prisma.quizSession.deleteMany({ where: { user_id: user.id, is_completed: false } });
        // Создаем новую сессию
        yield prisma.quizSession.create({
            data: { user_id: user.id, current_step: 1, answers: {} },
        });
        yield sendQuestion1(ctx);
    }
    catch (error) {
        console.error('Ошибка при создании сессии квиза:', error);
        yield ctx.reply('Произошла ошибка, попробуйте начать сначала: /start');
    }
}));
function saveAnswerAndNext(ctx, field, value, nextFunction) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
            if (!user)
                throw new Error('Пользователь не найден');
            const session = yield prisma.quizSession.findFirst({
                where: { user_id: user.id, is_completed: false },
                orderBy: { created_at: 'desc' },
            });
            if (!session)
                throw new Error('Активная сессия не найдена');
            const currentAnswers = session.answers || {};
            const updatedAnswers = Object.assign(Object.assign({}, currentAnswers), { [field]: value });
            yield prisma.quizSession.update({
                where: { id: session.id },
                data: { answers: updatedAnswers, current_step: (session.current_step || 0) + 1 },
            });
            yield nextFunction(ctx);
        }
        catch (error) {
            console.error('Ошибка при сохранении ответа:', error);
            yield ctx.reply('Произошла ошибка, попробуйте начать сначала: /start');
        }
    });
}
// --- Вопросы квиза ---
function sendQuestion1(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply(`❓ 1/3: Какой сайт вам нужен?`, { reply_markup: { inline_keyboard: [[{ text: '📄 Лендинг', callback_data: 'q1_landing' }], [{ text: '🛒 Магазин', callback_data: 'q1_shop' }]] } });
    });
}
bot.action('q1_landing', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Лендинг', sendQuestion2));
bot.action('q1_shop', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Магазин', sendQuestion2));
function sendQuestion2(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply(`❓ 2/3: В какой нише работаете?`, { reply_markup: { inline_keyboard: [[{ text: '⚙️ Услуги', callback_data: 'q2_services' }], [{ text: '✏️ Другое', callback_data: 'q2_other' }]] } });
    });
}
bot.action('q2_services', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Услуги', sendQuestion3));
bot.action('q2_other', (ctx) => ctx.reply('✏️ Напишите вашу нишу текстом:'));
function sendQuestion3(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.reply(`❓ 3/3: Как с вами связаться?\n\n📛 Напишите ваше имя:`);
    });
}
// --- ОБРАБОТКА ТЕКСТА ---
bot.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
        if (!user)
            return;
        const session = yield prisma.quizSession.findFirst({
            where: { user_id: user.id, is_completed: false },
            orderBy: { created_at: 'desc' },
        });
        if (!session || !('text' in ctx.message))
            return;
        const currentAnswers = session.answers || {};
        // Обработка ввода ниши на шаге 2
        if (session.current_step === 2 && !currentAnswers.niche) {
            yield saveAnswerAndNext(ctx, 'niche', ctx.message.text, sendQuestion3);
            return;
        }
        // Обработка ввода имени на шаге 3
        if (session.current_step === 3 && !currentAnswers.contacts) {
            currentAnswers.contacts = { name: ctx.message.text };
            yield prisma.quizSession.update({ data: { answers: currentAnswers }, where: { id: session.id } });
            yield ctx.reply('📱 Поделитесь вашим контактом для связи:', telegraf_1.Markup.keyboard([telegraf_1.Markup.button.contactRequest('📞 Поделиться контактом')]).resize().oneTime());
        }
    }
    catch (error) {
        console.error('Ошибка при обработке текста:', error);
    }
}));
// --- ОБРАБОТКА КОНТАКТА ---
bot.on('contact', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
        if (!user)
            return;
        const session = yield prisma.quizSession.findFirst({
            where: { user_id: user.id, is_completed: false },
            orderBy: { created_at: 'desc' },
        });
        if (!session)
            return;
        const currentAnswers = session.answers || {};
        if (currentAnswers.contacts && !currentAnswers.contacts.phone) {
            currentAnswers.contacts.phone = ctx.message.contact.phone_number;
            yield prisma.quizSession.update({
                data: { answers: currentAnswers, is_completed: true },
                where: { id: session.id }
            });
            const application = yield prisma.application.create({
                data: {
                    user_id: user.id,
                    status: 'new',
                    answers: currentAnswers,
                    contact_info: `${currentAnswers.contacts.name}, ${currentAnswers.contacts.phone}`,
                },
                include: { user: true },
            });
            console.log('Квиз завершен, заявка создана');
            yield notifyChannelNewApplication(application);
            yield ctx.reply(`🎉 Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.`, telegraf_1.Markup.removeKeyboard());
        }
    }
    catch (error) {
        console.error('Ошибка при обработке контакта:', error);
    }
}));
// --- КОМАНДА УДАЛЕНИЯ ДАННЫХ ---
bot.command('delete_data', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = ctx.from.id;
        // Prisma не может удалять по вложенному условию, поэтому сначала найдем ID пользователя
        const userToDelete = yield prisma.user.findUnique({ where: { telegram_id: userId } });
        if (userToDelete) {
            yield prisma.quizSession.deleteMany({ where: { user_id: userToDelete.id } });
            yield prisma.application.deleteMany({ where: { user_id: userToDelete.id } });
            yield prisma.user.delete({ where: { telegram_id: userId } });
            console.log(`Удалены данные пользователя: ${userId}`);
            yield ctx.reply(`✅ Ваши персональные данные удалены из нашей системы.`);
        }
        else {
            yield ctx.reply(`Ваши данные не найдены в системе.`);
        }
    }
    catch (error) {
        console.error('Ошибка удаления данных:', error);
        yield ctx.reply('❌ Ошибка при удалении данных. Обратитесь к администратору.');
    }
}));
// --- ФУНКЦИЯ ДЛЯ ОТПРАВКИ УВЕДОМЛЕНИЯ В КАНАЛ ---
function notifyChannelNewApplication(application) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { user, answers } = application;
            const contact = answers.contacts || {};
            const message = `🔔 НОВАЯ ЗАЯВКА!\n\n` +
                `👤 Клиент: ${user.first_name || 'Аноним'} (@${user.username || '?'})\n` +
                `📞 Контакты: ${contact.name}, ${contact.phone}\n\n` +
                `--- Ответы на квиз ---\n` +
                `Тип сайта: ${answers.site_type || '?'}\n` +
                `Ниша: ${answers.niche || '?'}`;
            if (CHANNEL_ID) {
                yield bot.telegram.sendMessage(CHANNEL_ID, message);
                console.log('✅ Уведомление в канал отправлено!');
            }
            else {
                console.error('❌ CHANNEL_ID не найден в .env файле!');
            }
        }
        catch (error) {
            console.error('❌ ОШИБКА отправки в канал:', error);
        }
    });
}
// --- ЗАПУСК БОТА ---
bot.launch();
console.log('✅ Бот успешно запущен!');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
