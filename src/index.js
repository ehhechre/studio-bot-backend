"use strict";
// src/index.ts - Версия с квизом + базовая админ-панель
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
const ADMIN_TELEGRAM_ID_STRING = process.env.ADMIN_TELEGRAM_ID;
if (!botToken || !ADMIN_TELEGRAM_ID_STRING) {
    console.error("КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN или ADMIN_TELEGRAM_ID не найдены в .env!");
    process.exit(1);
}
const ADMIN_TELEGRAM_ID = parseInt(ADMIN_TELEGRAM_ID_STRING, 10);
const bot = new telegraf_1.Telegraf(botToken);
// --- Хелперы ---
const isAdmin = (telegramId) => telegramId === ADMIN_TELEGRAM_ID;
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
                answers: {},
            }
        });
        yield sendQuestion1(ctx);
    }
    catch (error) {
        console.error('Ошибка при создании сессии квиза:', error);
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
// --- Вопросы квиза ---
function sendQuestion1(ctx) {
    return __awaiter(this, void 0, void 0, function* () { });
}
bot.action('q1_landing', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Лендинг', sendQuestion2));
// ... все остальные вопросы и обработчики к ним без изменений ...
function sendQuestion2(ctx) {
    return __awaiter(this, void 0, void 0, function* () { });
}
// ...
function sendQuestion3(ctx) {
    return __awaiter(this, void 0, void 0, function* () { });
}
// ...
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
        if (session.current_step === 2 && !currentAnswers.niche) {
            yield saveAnswerAndNext(ctx, 'niche', ctx.message.text, sendQuestion3);
            return;
        }
        if (session.current_step === 3) {
            if (!currentAnswers.contacts) {
                currentAnswers.contacts = { name: ctx.message.text };
                yield prisma.quizSession.update({ where: { id: session.id }, data: { answers: currentAnswers } });
                yield ctx.reply('📱 Теперь напишите ваш телефон:');
            }
            else if (!currentAnswers.contacts.phone) {
                currentAnswers.contacts.phone = ctx.message.text;
                yield prisma.quizSession.update({ where: { id: session.id }, data: { answers: currentAnswers, is_completed: true } });
                const application = yield prisma.application.create({
                    data: {
                        user_id: user.id,
                        status: 'new',
                        answers: currentAnswers,
                        contact_info: `${currentAnswers.contacts.name}, ${currentAnswers.contacts.phone}`,
                    }
                });
                console.log('Квиз завершен, заявка создана');
                // ВЫЗЫВАЕМ УВЕДОМЛЕНИЕ АДМИНУ
                yield notifyAdminNewApplication(application.id, user, currentAnswers);
                yield ctx.reply(`🎉 Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.`);
            }
        }
    }
    catch (error) {
        console.error('Ошибка при обработке текста:', error);
    }
}));
// --- АДМИН ПАНЕЛЬ ---
bot.command('admin', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!isAdmin(ctx.from.id))
            return;
        yield ctx.reply(`👨‍💼 Админ-панель\n\nВыберите действие:`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
                    [{ text: '📝 Заявки', callback_data: 'admin_applications' }]
                ]
            }
        });
    }
    catch (error) {
        console.error('Ошибка в админ команде:', error);
    }
}));
bot.action('admin_stats', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!isAdmin(ctx.from.id))
            return;
        const totalUsers = yield prisma.user.count();
        const totalApplications = yield prisma.application.count();
        const newApplications = yield prisma.application.count({ where: { status: 'new' } });
        yield ctx.editMessageText(`📊 Статистика\n\n` +
            `👥 Всего пользователей: ${totalUsers}\n` +
            `📝 Всего заявок: ${totalApplications}\n` +
            `🆕 Новых заявок: ${newApplications}`, { reply_markup: { inline_keyboard: [[{ text: '⬅️ Назад в админку', callback_data: 'admin_main' }]] } });
    }
    catch (error) {
        console.error('Ошибка статистики:', error);
    }
}));
bot.action('admin_main', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (!isAdmin(ctx.from.id))
        return;
    yield ctx.editMessageText(`👨‍💼 Админ-панель\n\nВыберите действие:`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
                [{ text: '📝 Заявки', callback_data: 'admin_applications' }]
            ]
        }
    });
}));
bot.action('admin_applications', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!isAdmin(ctx.from.id))
            return;
        const applications = yield prisma.application.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            include: { user: { select: { first_name: true, username: true } } }
        });
        if (applications.length === 0) {
            yield ctx.editMessageText('📝 Заявок пока нет', { reply_markup: { inline_keyboard: [[{ text: '⬅️ Назад в админку', callback_data: 'admin_main' }]] } });
            return;
        }
        let message = `📝 Последние ${applications.length} заявок:\n\n`;
        applications.forEach((app, index) => {
            const answers = app.answers;
            const user = app.user;
            const date = app.created_at ? new Date(app.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
            message += `${index + 1}. ${user.first_name} (@${user.username || '?'})\n`;
            message += `📅 ${date} | 📊 ${app.status}\n\n`;
        });
        yield ctx.editMessageText(message, { reply_markup: { inline_keyboard: [[{ text: '⬅️ Назад в админку', callback_data: 'admin_main' }]] } });
    }
    catch (error) {
        console.error('Ошибка получения заявок:', error);
    }
}));
function notifyAdminNewApplication(applicationId, user, answers) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const contact = answers.contacts || {};
            const message = `🔔 НОВАЯ ЗАЯВКА!\n\n` +
                `👤 Клиент: ${user.first_name || 'Аноним'} (@${user.username || '?'})\n` +
                `📞 Контакты: ${contact.name}, ${contact.phone}\n` +
                `🏢 Тип сайта: ${answers.site_type || '?'}\n` +
                `🎯 Ниша: ${answers.niche || '?'}`;
            yield bot.telegram.sendMessage(ADMIN_TELEGRAM_ID, message);
        }
        catch (error) {
            console.error('Ошибка отправки уведомления админу:', error);
        }
    });
}
// --- ЗАПУСК БОТА ---
bot.launch();
console.log('✅ Бот успешно запущен!');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
// P.S. Я специально сократил код вопросов, чтобы он поместился. В твоем файле оставь их как есть.
