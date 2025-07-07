"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const testUsernames = [
    'dmitriy_lavrukhin', 'NikitaEgamoff', 'casino_money_casino', 'lyaminvl',
    'Ftmrgn24', 'aarbiq', 'RomkaMironov', 'Remi4', 'Sevex228', 'kovstiv',
    'CoachKM', 'melaniomani', 'Ssharikdivision', 'fotique', 'notview', 'brain4Qs'
];
const testNames = [
    'Дмитрий Лаврухин', 'Никита Егамов', 'Алексей Казанов', 'Владимир Лямин',
    'Артем Моргунов', 'Арбик Селимов', 'Роман Миронов', 'Реми Волков',
    'Сева Дивизион', 'Константин Ковальчук', 'Максим Коуч', 'Мелания Романова',
    'Шарик Дивизион', 'Фотик Студийный', 'Антон Нотвью', 'Брейн Квестер'
];
const testSiteTypes = ['Лендинг', 'Многостраничный сайт', 'Интернет-магазин', 'Нужна консультация'];
const testNiches = ['Услуги', 'Образование', 'Строительство', 'Красота/мода', 'Недвижимость', 'IT-технологии'];
const testBrandStyles = ['Да, всё готово', 'Частично', 'Нет, нужно создать с нуля'];
const testComments = [
    'Нужен современный дизайн и быстрая загрузка',
    'Хочу что-то минималистичное и стильное',
    'Нужна интеграция с соцсетями',
    'Важна мобильная версия',
    'Нужен онлайн-чат и форма заявок',
    'Хочу уникальный дизайн под мой бренд',
    'Без комментария'
];
const sanitizeInput = (input) => {
    return input.trim().slice(0, 500).replace(/[<>\"']/g, '');
};
const validatePhone = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};
const validateName = (name) => {
    const cleaned = name.trim();
    return cleaned.length >= 2 && cleaned.length <= 50;
};
dotenv_1.default.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID_FOR_NOTIFY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://newdigital.moscow';
if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не найден в .env');
    process.exit(1);
}
if (!CHANNEL_ID) {
    console.error('❌ CHANNEL_ID не найден в .env');
    process.exit(1);
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
const prisma = new client_1.PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
    log: ['error', 'warn'],
    errorFormat: 'minimal'
});
const memoryQuizSessions = new Map();
const userCache = new Map();
const buttonCooldowns = new Map();
function checkButtonCooldown(userId) {
    const now = Date.now();
    const lastClick = buttonCooldowns.get(userId) || 0;
    if (now - lastClick < 1000) {
        return false;
    }
    buttonCooldowns.set(userId, now);
    return true;
}
function log(level, message, meta) {
    const timestamp = new Date().toISOString();
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📊';
    console.log(`${emoji} [${timestamp}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`);
}
async function safeDbOperation(operation, fallback) {
    try {
        return await operation();
    }
    catch (error) {
        log('error', 'Database operation failed', { error: error.message });
        return fallback ?? null;
    }
}
async function getCachedUser(telegramId) {
    try {
        if (userCache.has(telegramId)) {
            return userCache.get(telegramId);
        }
        const user = await safeDbOperation(async () => {
            return await prisma.users.findUnique({
                where: { telegram_id: telegramId.toString() }
            });
        });
        if (user) {
            userCache.set(telegramId, user);
        }
        return user;
    }
    catch (error) {
        log('error', 'getCachedUser failed', { error: error.message });
        return null;
    }
}
async function ensureUser(telegramUser) {
    return await safeDbOperation(async () => {
        const user = await prisma.users.upsert({
            where: { telegram_id: telegramUser.id.toString() },
            update: {
                username: telegramUser.username || null,
                first_name: telegramUser.first_name || null,
                last_name: telegramUser.last_name || null,
                language_code: telegramUser.language_code || null,
                updated_at: new Date()
            },
            create: {
                telegram_id: telegramUser.id.toString(),
                username: telegramUser.username || null,
                first_name: telegramUser.first_name || null,
                last_name: telegramUser.last_name || null,
                language_code: telegramUser.language_code || null
            }
        });
        userCache.set(telegramUser.id, user);
        return user;
    });
}
function isAdmin(userId) {
    return ADMIN_TELEGRAM_ID === userId.toString();
}
async function getStats() {
    try {
        const stats = await safeDbOperation(async () => {
            const totalUsers = await prisma.users.count();
            const totalApplications = await prisma.applications.count();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayApplications = await prisma.applications.count({
                where: { created_at: { gte: todayStart } }
            });
            const newApplications = await prisma.applications.count({
                where: { status: 'new' }
            });
            return { totalUsers, totalApplications, todayApplications, newApplications };
        });
        return stats || { totalUsers: 0, totalApplications: 0, todayApplications: 0, newApplications: 0 };
    }
    catch (error) {
        log('error', 'Error getting stats', { error: error.message });
        return { totalUsers: 0, totalApplications: 0, todayApplications: 0, newApplications: 0 };
    }
}
async function generateTestApplications(count = 5) {
    const results = [];
    for (let i = 0; i < count; i++) {
        try {
            const randomIndex = Math.floor(Math.random() * testUsernames.length);
            const testUsername = testUsernames[randomIndex];
            const testName = testNames[randomIndex];
            const testTelegramId = Math.floor(Math.random() * 1000000) + 100000;
            const testAnswers = {
                site_type: testSiteTypes[Math.floor(Math.random() * testSiteTypes.length)],
                niche: testNiches[Math.floor(Math.random() * testNiches.length)],
                brand_style: testBrandStyles[Math.floor(Math.random() * testBrandStyles.length)],
                contacts: {
                    name: testName,
                    phone: '+7' + Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
                    comment: testComments[Math.floor(Math.random() * testComments.length)]
                }
            };
            const testUser = await safeDbOperation(async () => {
                return await prisma.users.create({
                    data: {
                        telegram_id: testTelegramId.toString(),
                        username: testUsername,
                        first_name: testName.split(' ')[0],
                        last_name: testName.split(' ')[1] || null
                    }
                });
            });
            if (!testUser) {
                log('error', 'Failed to create test user', { username: testUsername });
                continue;
            }
            const testApplication = await safeDbOperation(async () => {
                return await prisma.applications.create({
                    data: {
                        user_id: testUser.id,
                        answers: testAnswers,
                        status: 'new'
                    }
                });
            });
            if (testApplication) {
                await notifyChannelNewApplication(testApplication, testAnswers, testUser);
                results.push({ username: testUsername, applicationId: testApplication.id });
                log('info', 'Test application created', {
                    username: testUsername,
                    applicationId: testApplication.id
                });
            }
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
        catch (error) {
            log('error', 'Error creating test application', { error: error.message });
        }
    }
    return results;
}
const mainMenuKeyboard = telegraf_1.Markup.inlineKeyboard([
    [telegraf_1.Markup.button.callback('💰 Рассчитать стоимость', 'start_quiz')],
    [telegraf_1.Markup.button.webApp('👁 Посмотреть работы', 'https://ehhechre.github.io/studio-bot-backend/webapp/')],
    [telegraf_1.Markup.button.callback('📞 Связаться с нами', 'contact')]
]);
const mainMenuText = `Здравствуйте! Меня зовут Полина, я консультант студии Polli Digital.\n\n` +
    `Мы создаём бренды, сайты и маркетинг, которые работают на результат и узнаваемость.\n\n` +
    `Буду рада обсудить ваш проект и помочь найти лучшее решение для вашего бизнеса.\n\n` +
    `✨ Выберите действие:`;
bot.start(async (ctx) => {
    try {
        const telegramUser = ctx.from;
        if (!telegramUser) {
            await ctx.reply('❌ Ошибка получения данных пользователя');
            return;
        }
        log('info', 'User started bot', { userId: telegramUser.id });
        await ensureUser(telegramUser);
        try {
            await ctx.replyWithPhoto('AgACAgIAAxkBAAICRWhpw6XXPrldcv1IK2YUf2boX6mxAAL99jEbaHNQS0g_hguljSVZAQADAgADeQADNgQ', {
                caption: `Здравствуйте! Меня зовут Полина, я консультант студии Polli Digital.\n\n` +
                    `Мы создаём бренды, сайты и маркетинг, которые работают на результат и узнаваемость.\n\n` +
                    `Буду рада обсудить ваш проект и помочь найти лучшее решение для вашего бизнеса.`,
                reply_markup: mainMenuKeyboard.reply_markup
            });
            log('info', 'Welcome sent with logo', { userId: telegramUser.id });
        }
        catch (photoError) {
            log('warn', 'Failed to send photo, sending text', { error: photoError.message });
            await ctx.reply(mainMenuText, mainMenuKeyboard);
        }
    }
    catch (error) {
        log('error', 'Error in start command', { error: error.message });
        await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
    }
});
bot.command('cases', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        log('info', 'Cases command used', { userId: ctx.from.id });
        await ctx.reply('👁 Посмотрите наши работы:', {
            reply_markup: {
                inline_keyboard: [[
                        {
                            text: '🎨 Портфолио Polli Digital',
                            web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' }
                        }
                    ]]
            }
        });
    }
    catch (error) {
        log('error', 'Error in cases command', { error: error.message });
        await ctx.reply('⚠️ Ошибка загрузки портфолио. Попробуйте позже.');
    }
});
bot.command('app', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        log('info', 'App command used', { userId: ctx.from.id });
        await ctx.reply('🚀 Откройте наше приложение:', {
            reply_markup: {
                inline_keyboard: [[
                        {
                            text: '🎨 Polli Digital App',
                            web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' }
                        }
                    ]]
            }
        });
    }
    catch (error) {
        log('error', 'Error in app command', { error: error.message });
        await ctx.reply('⚠️ Ошибка запуска приложения. Попробуйте позже.');
    }
});
bot.command('admin', async (ctx) => {
    try {
        if (!ctx.from || !isAdmin(ctx.from.id)) {
            await ctx.reply('❌ У вас нет прав доступа');
            return;
        }
        await ctx.reply(`👨‍💼 Админ панель\n\n` +
            `Доступные команды:\n` +
            `/stats - статистика бота\n` +
            `/status - статус системы`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📊 Статистика', 'admin_stats')],
            [telegraf_1.Markup.button.callback('⚙️ Статус системы', 'admin_status')],
            [telegraf_1.Markup.button.callback('🧪 Тестовые заявки', 'admin_test_apps')]
        ]));
    }
    catch (error) {
        log('error', 'Error in admin command', { error: error.message });
    }
});
bot.command('stats', async (ctx) => {
    try {
        if (!ctx.from || !isAdmin(ctx.from.id))
            return;
        const stats = await getStats();
        const activeSessions = memoryQuizSessions.size;
        await ctx.reply(`📊 Статистика бота\n\n` +
            `👥 Всего пользователей: ${stats.totalUsers}\n` +
            `📋 Всего заявок: ${stats.totalApplications}\n` +
            `🆕 Заявок сегодня: ${stats.todayApplications}\n` +
            `⏳ Новых заявок: ${stats.newApplications}\n` +
            `🔄 Активных сессий: ${activeSessions}\n\n` +
            `⏰ Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`);
    }
    catch (error) {
        log('error', 'Error in stats command', { error: error.message });
    }
});
bot.command('status', async (ctx) => {
    try {
        if (!ctx.from || !isAdmin(ctx.from.id))
            return;
        let dbStatus = '❌ Недоступна';
        try {
            await prisma.$queryRaw `SELECT 1`;
            dbStatus = '✅ Работает';
        }
        catch {
            dbStatus = '❌ Ошибка подключения';
        }
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        await ctx.reply(`⚙️ Статус системы\n\n` +
            `🗄️ База данных: ${dbStatus}\n` +
            `⏱️ Время работы: ${hours}ч ${minutes}м\n` +
            `💾 Использование памяти: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n` +
            `🔄 Активных сессий: ${memoryQuizSessions.size}\n` +
            `📊 PID процесса: ${process.pid}`);
    }
    catch (error) {
        log('error', 'Error in status command', { error: error.message });
    }
});
bot.action('start_quiz', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        log('info', 'User started quiz', { userId: ctx.from.id });
        const existingSession = memoryQuizSessions.get(ctx.from.id);
        if (existingSession) {
            await ctx.reply(`📋 У вас уже есть незавершенный опрос!\n\n` +
                `📍 Текущий вопрос: ${existingSession.currentStep}/4\n\n` +
                `Хотите продолжить или начать заново?`, telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('▶️ Продолжить', 'continue_quiz')],
                [telegraf_1.Markup.button.callback('🔄 Начать заново', 'restart_quiz')],
                [telegraf_1.Markup.button.callback('◀️ Главное меню', 'main_menu')]
            ]));
            return;
        }
        await ctx.reply(`📋 СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ\n\n` +
            `Я даю согласие на обработку моих персональных данных (имя, телефон, Telegram ID) с целью предоставления услуг веб-разработки и связи со мной.\n\n` +
            `Срок хранения данных - 3 года. Я могу отозвать согласие командой /delete_data.`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('✅ Согласен', 'consent_agree')],
            [telegraf_1.Markup.button.callback('❌ Не согласен', 'consent_decline')]
        ]));
    }
    catch (error) {
        log('error', 'Error in start_quiz', { error: error.message });
        await ctx.reply('❌ Ошибка при запуске опроса');
    }
});
bot.action('admin_test_apps', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('❌ Нет доступа');
        return;
    }
    await ctx.editMessageText('🧪 Генерация тестовых заявок...', telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback('🔢 Создать 3 заявки', 'generate_test_3')],
        [telegraf_1.Markup.button.callback('🔢 Создать 5 заявок', 'generate_test_5')],
        [telegraf_1.Markup.button.callback('🔢 Создать 10 заявок', 'generate_test_10')],
        [telegraf_1.Markup.button.callback('⬅️ Назад', 'admin_back')]
    ]));
});
bot.action('generate_test_3', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('❌ Нет доступа');
        return;
    }
    await ctx.editMessageText('🔄 Создаю 3 тестовые заявки...');
    const results = await generateTestApplications(3);
    let message = `✅ Создано ${results.length} тестовых заявок:\n\n`;
    results.forEach((result, index) => {
        message += `${index + 1}. @${result.username} - заявка #${result.applicationId}\n`;
    });
    await ctx.editMessageText(message, telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback('⬅️ Назад', 'admin_test_apps')]
    ]));
});
bot.action('generate_test_5', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('❌ Нет доступа');
        return;
    }
    await ctx.editMessageText('🔄 Создаю 5 тестовых заявок...');
    const results = await generateTestApplications(5);
    let message = `✅ Создано ${results.length} тестовых заявок:\n\n`;
    results.forEach((result, index) => {
        message += `${index + 1}. @${result.username} - заявка #${result.applicationId}\n`;
    });
    await ctx.editMessageText(message, telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback('⬅️ Назад', 'admin_test_apps')]
    ]));
});
bot.action('generate_test_10', async (ctx) => {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
        await ctx.answerCbQuery('❌ Нет доступа');
        return;
    }
    await ctx.editMessageText('🔄 Создаю 10 тестовых заявок...');
    const results = await generateTestApplications(10);
    let message = `✅ Создано ${results.length} тестовых заявок:\n\n`;
    results.forEach((result, index) => {
        message += `${index + 1}. @${result.username} - заявка #${result.applicationId}\n`;
    });
    await ctx.editMessageText(message, telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback('⬅️ Назад', 'admin_test_apps')]
    ]));
});
bot.action('consent_agree', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        log('info', 'User agreed to consent', { userId: ctx.from.id });
        const session = {
            userId: ctx.from.id.toString(),
            currentStep: 1,
            answers: {},
            startedAt: new Date()
        };
        memoryQuizSessions.set(ctx.from.id, session);
        await sendQuestion1(ctx);
    }
    catch (error) {
        log('error', 'Error in consent_agree', { error: error.message });
    }
});
bot.action('consent_decline', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        log('info', 'User declined consent', { userId: ctx.from.id });
        await ctx.reply(`❌ Понял вас. Без согласия мы не можем начать опрос.\n\nЕсли передумаете - нажмите /start`);
    }
    catch (error) {
        log('error', 'Error in consent_decline', { error: error.message });
    }
});
bot.action('contact', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        log('info', 'User viewing contacts', { userId: ctx.from.id });
        await ctx.reply(`📞 Связаться с нами\n\n` +
            `💬 Telegram: @polli_woww\n` +
            `📱 WhatsApp: +7 (911) 184-80-08\n` +
            `📧 Email: info@newdigital.moscow\n\n` +
            `🌐 Сайт: ${WEBSITE_URL}\n\n` +
            `⏰ Работаем: Пн-Пт 10:00-19:00 МСК`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.url('💬 Telegram', 'https://t.me/polli_woww')],
            [telegraf_1.Markup.button.url('📱 WhatsApp', 'https://wa.me/79111848008')],
            [telegraf_1.Markup.button.callback('◀️ Главное меню', 'main_menu')]
        ]));
    }
    catch (error) {
        log('error', 'Error in contact', { error: error.message });
    }
});
bot.action('main_menu', async (ctx) => {
    try {
        await ctx.reply(mainMenuText, mainMenuKeyboard);
    }
    catch (error) {
        log('error', 'Error returning to main menu', { error: error.message });
    }
});
async function sendQuestion1(ctx) {
    try {
        if (!ctx.from)
            return;
        const session = memoryQuizSessions.get(ctx.from.id);
        if (session) {
            session.currentStep = 1;
        }
        await ctx.reply(`❓ 1/4: Какой сайт вам нужен?`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📄 Лендинг', 'q1_landing')],
            [telegraf_1.Markup.button.callback('🌐 Многостраничный сайт', 'q1_multipage')],
            [telegraf_1.Markup.button.callback('🛒 Интернет-магазин', 'q1_shop')],
            [telegraf_1.Markup.button.callback('🤔 Не знаю — нужна консультация', 'q1_consultation')]
        ]));
        log('info', 'Question 1 shown', { userId: ctx.from?.id });
    }
    catch (error) {
        log('error', 'Error in sendQuestion1', { error: error.message });
    }
}
async function sendQuestion2(ctx) {
    try {
        if (!ctx.from)
            return;
        const session = memoryQuizSessions.get(ctx.from.id);
        if (session) {
            session.currentStep = 2;
        }
        await ctx.reply(`❓ 2/4: В какой нише вы работаете?`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('⚙️ Услуги', 'q2_services')],
            [telegraf_1.Markup.button.callback('🎓 Образование', 'q2_education')],
            [telegraf_1.Markup.button.callback('🏗 Строительство', 'q2_construction')],
            [telegraf_1.Markup.button.callback('💄 Красота/мода', 'q2_beauty')],
            [telegraf_1.Markup.button.callback('🏠 Недвижимость', 'q2_realestate')],
            [telegraf_1.Markup.button.callback('✏️ Другое', 'q2_other')]
        ]));
        log('info', 'Question 2 shown', { userId: ctx.from?.id, step: 2 });
    }
    catch (error) {
        log('error', 'Error in sendQuestion2', { error: error.message });
    }
}
async function sendQuestion3(ctx) {
    try {
        if (!ctx.from)
            return;
        const session = memoryQuizSessions.get(ctx.from.id);
        if (session) {
            session.currentStep = 3;
        }
        await ctx.reply(`❓ 3/4: Есть ли у вас фирменный стиль или логотип?`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('✅ Да, всё готово', 'q3_ready')],
            [telegraf_1.Markup.button.callback('🔄 Частично', 'q3_partial')],
            [telegraf_1.Markup.button.callback('❌ Нет, нужно создать с нуля', 'q3_none')]
        ]));
        log('info', 'Question 3 shown', { userId: ctx.from?.id, step: 3 });
    }
    catch (error) {
        log('error', 'Error in sendQuestion3', { error: error.message });
    }
}
async function sendQuestion4(ctx) {
    try {
        if (!ctx.from)
            return;
        const session = memoryQuizSessions.get(ctx.from.id);
        if (session) {
            session.currentStep = 4;
        }
        await ctx.reply(`❓ 4/4: Как с вами связаться?\n\n📛 Напишите ваше имя:`);
        log('info', 'Question 4 shown', { userId: ctx.from?.id, step: 4 });
    }
    catch (error) {
        log('error', 'Error in sendQuestion4', { error: error.message });
    }
}
async function saveAnswerAndNext(ctx, field, value, nextStep, nextFunction) {
    try {
        if (!ctx.from)
            return;
        if (!checkButtonCooldown(ctx.from.id)) {
            await ctx.answerCbQuery('⏳ Подождите секунду...');
            return;
        }
        const session = memoryQuizSessions.get(ctx.from.id);
        if (!session) {
            await ctx.answerCbQuery('❌ Сессия не найдена');
            await ctx.reply('❌ Сессия не найдена. Начните заново: /start');
            return;
        }
        if (session.currentStep !== nextStep - 1) {
            await ctx.answerCbQuery('⚠️ Неактуальная кнопка');
            log('warn', 'Wrong step click', {
                userId: ctx.from.id,
                currentStep: session.currentStep,
                expectedStep: nextStep - 1
            });
            return;
        }
        await ctx.answerCbQuery('✅ Ответ сохранен');
        const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
        session.answers[field] = sanitizedValue;
        session.currentStep = nextStep;
        log('info', 'Answer saved', {
            userId: ctx.from.id,
            field,
            value: typeof value === 'string' ? value.slice(0, 50) : value,
            newStep: nextStep
        });
        await nextFunction(ctx);
    }
    catch (error) {
        log('error', 'Error in saveAnswerAndNext', { error: error.message });
        await ctx.reply('❌ Ошибка сохранения ответа. Попробуйте начать сначала: /start');
    }
}
bot.action('q1_landing', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Лендинг', 2, sendQuestion2));
bot.action('q1_multipage', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Многостраничный сайт', 2, sendQuestion2));
bot.action('q1_shop', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Интернет-магазин', 2, sendQuestion2));
bot.action('q1_consultation', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Нужна консультация', 2, sendQuestion2));
bot.action('q2_services', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Услуги', 3, sendQuestion3));
bot.action('q2_education', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Образование', 3, sendQuestion3));
bot.action('q2_construction', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Строительство', 3, sendQuestion3));
bot.action('q2_beauty', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Красота/мода', 3, sendQuestion3));
bot.action('q2_realestate', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Недвижимость', 3, sendQuestion3));
bot.action('q3_ready', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Да, всё готово', 4, sendQuestion4));
bot.action('q3_partial', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Частично', 4, sendQuestion4));
bot.action('q3_none', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Нет, нужно создать с нуля', 4, sendQuestion4));
bot.action('continue_quiz', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        if (!checkButtonCooldown(ctx.from.id)) {
            await ctx.answerCbQuery('⏳ Подождите секунду...');
            return;
        }
        const session = memoryQuizSessions.get(ctx.from.id);
        if (!session) {
            await ctx.answerCbQuery('❌ Сессия не найдена');
            await ctx.reply('❌ Сессия не найдена. Начните заново: /start');
            return;
        }
        await ctx.answerCbQuery('▶️ Продолжаем...');
        if (session.currentStep === 1) {
            await sendQuestion1(ctx);
        }
        else if (session.currentStep === 2) {
            await sendQuestion2(ctx);
        }
        else if (session.currentStep === 3) {
            await sendQuestion3(ctx);
        }
        else {
            await sendQuestion4(ctx);
        }
    }
    catch (error) {
        log('error', 'Error continuing quiz', { error: error.message });
    }
});
bot.action('restart_quiz', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        if (!checkButtonCooldown(ctx.from.id)) {
            await ctx.answerCbQuery('⏳ Подождите секунду...');
            return;
        }
        await ctx.answerCbQuery('🔄 Начинаем заново...');
        memoryQuizSessions.delete(ctx.from.id);
        const session = {
            userId: ctx.from.id.toString(),
            currentStep: 1,
            answers: {},
            startedAt: new Date()
        };
        memoryQuizSessions.set(ctx.from.id, session);
        await sendQuestion1(ctx);
    }
    catch (error) {
        log('error', 'Error restarting quiz', { error: error.message });
    }
});
bot.action('q2_other', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        if (!checkButtonCooldown(ctx.from.id)) {
            await ctx.answerCbQuery('⏳ Подождите секунду...');
            return;
        }
        const session = memoryQuizSessions.get(ctx.from.id);
        if (!session || session.currentStep !== 2) {
            await ctx.answerCbQuery('⚠️ Неактуальная кнопка');
            return;
        }
        await ctx.answerCbQuery('✏️ Укажите нишу');
        await ctx.reply('✏️ Напишите вашу нишу текстом (например: "IT", "Медицина", "Юриспруденция"):');
        log('info', 'Custom niche requested', { userId: ctx.from.id });
    }
    catch (error) {
        log('error', 'Error in q2_other', { error: error.message });
    }
});
bot.action('no_comment', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        if (!checkButtonCooldown(ctx.from.id)) {
            await ctx.answerCbQuery('⏳ Подождите секунду...');
            return;
        }
        await ctx.answerCbQuery('✅ Завершаю оформление заявки...');
        await completeApplication(ctx, 'Без комментария');
    }
    catch (error) {
        log('error', 'Error in no_comment', { error: error.message });
    }
});
bot.on('text', async (ctx) => {
    try {
        if (!ctx.from || !ctx.message || !('text' in ctx.message))
            return;
        const messageText = ctx.message.text;
        const sanitizedText = sanitizeInput(messageText);
        const session = memoryQuizSessions.get(ctx.from.id);
        if (!session) {
            await ctx.reply(`Спасибо за сообщение! 😊\n\nВоспользуйтесь главным меню:`, mainMenuKeyboard);
            return;
        }
        log('info', 'Text message in quiz', {
            userId: ctx.from.id,
            step: session.currentStep,
            message: messageText.slice(0, 50)
        });
        if (session.currentStep === 2 && !session.answers.niche) {
            if (sanitizedText.length < 2) {
                await ctx.reply('⚠️ Слишком короткое название ниши. Введите минимум 2 символа.');
                return;
            }
            session.answers.niche = sanitizedText;
            session.currentStep = 3;
            await ctx.reply('✅ Ниша сохранена');
            await sendQuestion3(ctx);
            return;
        }
        if (session.currentStep === 4 && !session.answers.contacts) {
            if (!validateName(sanitizedText)) {
                await ctx.reply('⚠️ Пожалуйста, введите корректное имя (2-50 символов).\n\n' +
                    'Например: "Иван" или "Анна Петрова"');
                return;
            }
            session.answers.contacts = { name: sanitizedText };
            await ctx.reply('✅ Имя сохранено');
            await ctx.reply('📱 Поделитесь вашим контактом для связи:', telegraf_1.Markup.keyboard([
                telegraf_1.Markup.button.contactRequest('📞 Поделиться контактом')
            ]).resize().oneTime());
            log('info', 'Name saved', { userId: ctx.from.id, name: sanitizedText.slice(0, 20), step: 4 });
            return;
        }
        if (session.currentStep === 4 &&
            session.answers.contacts &&
            session.answers.contacts.phone &&
            !session.answers.contacts.comment) {
            if (sanitizedText.length > 1000) {
                await ctx.reply('⚠️ Комментарий слишком длинный. Максимум 1000 символов.');
                return;
            }
            await ctx.reply('✅ Комментарий сохранен. Оформляю заявку...');
            await completeApplication(ctx, sanitizedText);
            return;
        }
        await ctx.reply(`🤔 Не понял ваше сообщение на текущем этапе (шаг ${session.currentStep}).\n\n` +
            `Попробуйте начать заново: /start`);
    }
    catch (error) {
        log('error', 'Error handling text message', { error: error.message });
        await ctx.reply('⚠️ Ошибка обработки сообщения. Попробуйте еще раз.');
    }
});
bot.on('contact', async (ctx) => {
    try {
        if (!ctx.from || !ctx.message || !('contact' in ctx.message))
            return;
        const session = memoryQuizSessions.get(ctx.from.id);
        if (!session || !session.answers.contacts)
            return;
        const phoneNumber = ctx.message.contact.phone_number;
        if (!validatePhone(phoneNumber)) {
            await ctx.reply('⚠️ Некорректный номер телефона. Попробуйте поделиться контактом еще раз.', telegraf_1.Markup.removeKeyboard());
            return;
        }
        session.answers.contacts.phone = phoneNumber;
        log('info', 'Phone saved', {
            userId: ctx.from.id,
            phone: phoneNumber.slice(0, 8) + '***',
            isValid: validatePhone(phoneNumber)
        });
        await ctx.reply('✅ Контакт получен!', telegraf_1.Markup.removeKeyboard());
        await ctx.reply('✍️ Есть комментарий к заказу?\n\n💡 Расскажите о ваших пожеланиях, сроках или особенностях проекта.\n\nИли нажмите кнопку ниже:', telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('✅ Нет комментария', 'no_comment')]
        ]));
    }
    catch (error) {
        log('error', 'Error processing contact', { error: error.message });
        await ctx.reply('⚠️ Ошибка обработки контакта. Попробуйте еще раз.');
    }
});
async function completeApplication(ctx, comment) {
    try {
        if (!ctx.from)
            return;
        const session = memoryQuizSessions.get(ctx.from.id);
        if (!session) {
            await ctx.reply('❌ Сессия завершена. Начните заново: /start');
            return;
        }
        if (!session.answers.contacts || !session.answers.contacts.phone) {
            await ctx.reply('❌ Не хватает контактных данных. Начните заново: /start');
            return;
        }
        session.answers.contacts.comment = comment;
        let user = await getCachedUser(ctx.from.id);
        if (!user) {
            const telegramUser = ctx.from;
            const newUser = await safeDbOperation(async () => {
                return await prisma.users.create({
                    data: {
                        telegram_id: telegramUser.id.toString(),
                        username: telegramUser.username || null,
                        first_name: telegramUser.first_name || null,
                        last_name: telegramUser.last_name || null
                    }
                });
            });
            if (!newUser) {
                await ctx.reply('❌ Ошибка создания пользователя. Свяжитесь с нами напрямую.');
                return;
            }
            userCache.set(ctx.from.id, newUser);
            user = newUser;
        }
        const application = await safeDbOperation(async () => {
            return await prisma.applications.create({
                data: {
                    user_id: user.id,
                    answers: session.answers,
                    status: 'new'
                },
                include: { user: true }
            });
        });
        memoryQuizSessions.delete(ctx.from.id);
        await notifyChannelNewApplication(application, session.answers, user);
        log('info', 'Application completed', {
            userId: ctx.from.id,
            applicationId: application?.id,
            hasComment: comment !== 'Без комментария'
        });
        await ctx.reply(`🎉 Спасибо! Ваша заявка принята.\n\n` +
            `📞 Мы свяжемся с вами в течение 2 часов!\n\n` +
            `Пока ждете — посмотрите наши работы:`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.webApp('👁 Посмотреть портфолио', 'https://ehhechre.github.io/studio-bot-backend/webapp/')],
            [telegraf_1.Markup.button.callback('🏠 Главное меню', 'main_menu')]
        ]));
    }
    catch (error) {
        log('error', 'Error completing application', { error: error.message });
        if (ctx.from?.id) {
            memoryQuizSessions.delete(ctx.from.id);
        }
        await ctx.reply('❌ Ошибка при сохранении заявки. Свяжитесь с нами напрямую: @polli_woww');
    }
}
async function notifyChannelNewApplication(application, answers, user) {
    try {
        const contact = answers.contacts || {};
        const isValidPhone = contact.phone ? validatePhone(contact.phone) : false;
        const phoneStatus = isValidPhone ? '✅' : '⚠️';
        const message = `🔔 НОВАЯ ЗАЯВКА\n\n` +
            `👤 Клиент: ${user.first_name || 'Аноним'} (@${user.username || 'без username'})\n` +
            `📞 Контакты: ${contact.name}, ${contact.phone} ${phoneStatus}\n` +
            `🆔 Telegram ID: ${user.telegram_id}\n\n` +
            `--- Ответы на квиз ---\n` +
            `🌐 Тип сайта: ${answers.site_type || 'Не указано'}\n` +
            `🏢 Ниша: ${answers.niche || 'Не указано'}\n` +
            `🎨 Фирменный стиль: ${answers.brand_style || 'Не указано'}\n` +
            `💬 Комментарий: ${contact.comment || 'Нет'}`;
        if (CHANNEL_ID) {
            await bot.telegram.sendMessage(CHANNEL_ID, message);
            log('info', 'Application sent to channel', {
                channelId: CHANNEL_ID,
                applicationId: application?.id
            });
        }
        else {
            log('error', 'CHANNEL_ID not found', {});
        }
    }
    catch (error) {
        log('error', 'Failed to notify channel', { error: error.message });
    }
}
bot.command('delete_data', async (ctx) => {
    try {
        if (!ctx.from)
            return;
        const userId = ctx.from.id;
        log('info', 'Delete data requested', { userId });
        const userToDelete = await safeDbOperation(async () => {
            return await prisma.users.findUnique({
                where: { telegram_id: userId.toString() }
            });
        });
        if (userToDelete) {
            await safeDbOperation(async () => {
                await prisma.applications.deleteMany({ where: { user_id: userToDelete.id } });
                await prisma.users.delete({ where: { telegram_id: userId.toString() } });
            });
            userCache.delete(userId);
            memoryQuizSessions.delete(userId);
            log('info', 'User data deleted', { userId });
            await ctx.reply(`✅ Ваши персональные данные полностью удалены из нашей системы.\n\n` +
                `Удалено:\n` +
                `• Профиль пользователя\n` +
                `• Заявки и контакты\n\n` +
                `Спасибо за использование нашего сервиса!`);
        }
        else {
            await ctx.reply(`ℹ️ Ваши данные не найдены в системе.`);
        }
    }
    catch (error) {
        log('error', 'Error deleting user data', { error: error.message });
        await ctx.reply('❌ Ошибка при удалении данных. Обратитесь к администратору.');
    }
});
bot.action('admin_stats', async (ctx) => {
    try {
        if (!ctx.from || !isAdmin(ctx.from.id))
            return;
        const stats = await getStats();
        await ctx.reply(`📊 Детальная статистика\n\n` +
            `👥 Пользователи: ${stats.totalUsers}\n` +
            `📋 Заявки: ${stats.totalApplications}\n` +
            `🆕 Сегодня: ${stats.todayApplications}\n` +
            `⏳ К обработке: ${stats.newApplications}`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('⚙️ Статус системы', 'admin_status')],
            [telegraf_1.Markup.button.callback('◀️ Назад', 'admin_back')]
        ]));
    }
    catch (error) {
        log('error', 'Error in admin_stats action', { error: error.message });
    }
});
bot.action('admin_status', async (ctx) => {
    try {
        if (!ctx.from || !isAdmin(ctx.from.id))
            return;
        let dbStatus = '❌';
        try {
            await prisma.$queryRaw `SELECT 1`;
            dbStatus = '✅';
        }
        catch {
            dbStatus = '❌';
        }
        await ctx.reply(`⚙️ Статус системы\n\n` +
            `🗄️ БД: ${dbStatus}\n` +
            `💾 RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n` +
            `🔄 Сессии: ${memoryQuizSessions.size}\n` +
            `⏱️ Аптайм: ${Math.floor(process.uptime() / 60)}м`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📊 Статистика', 'admin_stats')],
            [telegraf_1.Markup.button.callback('◀️ Назад', 'admin_back')]
        ]));
    }
    catch (error) {
        log('error', 'Error in admin_status action', { error: error.message });
    }
});
bot.action('admin_back', async (ctx) => {
    try {
        if (!ctx.from || !isAdmin(ctx.from.id))
            return;
        await ctx.reply(`👨‍💼 Админ панель\n\n` +
            `Доступные команды:\n` +
            `/stats - статистика\n` +
            `/status - статус системы`, telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📊 Статистика', 'admin_stats')],
            [telegraf_1.Markup.button.callback('⚙️ Статус системы', 'admin_status')],
            [telegraf_1.Markup.button.callback('🧪 Тестовые заявки', 'admin_test_apps')]
        ]));
    }
    catch (error) {
        log('error', 'Error in admin_back action', { error: error.message });
    }
});
bot.catch((err, ctx) => {
    const error = err instanceof Error ? err : new Error(String(err));
    log('error', 'Bot error', {
        error: error.message,
        userId: ctx.from?.id
    });
});
setInterval(async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        log('info', 'Database health check: OK');
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;
        for (const [userId, lastClick] of buttonCooldowns.entries()) {
            if (lastClick < tenMinutesAgo) {
                buttonCooldowns.delete(userId);
            }
        }
        log('info', 'Cleanup completed', {
            activeSessions: memoryQuizSessions.size,
            activeCooldowns: buttonCooldowns.size
        });
    }
    catch (error) {
        log('error', 'Database health check failed', { error: error.message });
    }
}, 5 * 60 * 1000);
async function gracefulShutdown(signal) {
    log('info', `Received ${signal}, shutting down gracefully...`);
    try {
        bot.stop(signal);
        await prisma.$disconnect();
        log('info', 'Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        log('error', 'Error during shutdown', { error: error.message });
        process.exit(1);
    }
}
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
async function start() {
    try {
        await prisma.$connect();
        log('info', 'Database connected successfully');
        await bot.telegram.setMyCommands([
            { command: 'app', description: 'Кейсы' }
        ]);
        await bot.launch();
        log('info', '🚀 Production Stable Bot v3.0 + Test Apps started successfully!');
        log('info', `📊 Active sessions: ${memoryQuizSessions.size}`);
        log('info', `💾 Memory usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
        log('info', '✅ All systems operational');
    }
    catch (error) {
        log('error', 'Failed to start bot', { error: error.message });
        process.exit(1);
    }
}
start();
