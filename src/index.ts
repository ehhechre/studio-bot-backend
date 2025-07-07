// src/bot.ts - PRODUCTION STABLE BOT v3.0 - Адаптированный под рабочую логику
import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// --- Типы ---
interface TelegramContext extends Context {
  // Наследуем стандартный Context без переопределения from
}

interface QuizSession {
  userId: string;
  currentStep: number;
  answers: Record<string, any>;
  startedAt: Date;
}

// --- Валидация и безопасность ---
const sanitizeInput = (input: string): string => {
  return input.trim().slice(0, 500).replace(/[<>\"']/g, '');
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 50 && /^[a-zA-Zа-яА-Я\s]+$/.test(name);
};

// --- Конфигурация ---
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID_FOR_NOTIFY;
const CHANNEL_ID = process.env.CHANNEL_ID; // Канал для заявок
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

// --- Инициализация с retry логикой ---
const bot = new Telegraf(BOT_TOKEN);
const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ['error', 'warn'],
  errorFormat: 'minimal'
});

// Сессии в памяти (fallback если БД недоступна)
const memoryQuizSessions = new Map<number, QuizSession>();
const userCache = new Map<number, any>();

// --- Утилиты ---
function log(level: 'info' | 'error' | 'warn', message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📊';
  console.log(`${emoji} [${timestamp}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`);
}

async function safeDbOperation<T>(operation: () => Promise<T>, fallback?: T): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    log('error', 'Database operation failed', { error: (error as Error).message });
    return fallback ?? null;
  }
}

async function getCachedUser(telegramId: number) {
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
  } catch (error) {
    log('error', 'getCachedUser failed', { error: (error as Error).message });
    return null;
  }
}

async function ensureUser(telegramUser: NonNullable<TelegramContext['from']>) {
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
    
    // Обновляем кеш
    userCache.set(telegramUser.id, user);
    return user;
  });
}

function isAdmin(userId: number): boolean {
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
  } catch (error) {
    log('error', 'Error getting stats', { error: (error as Error).message });
    return { totalUsers: 0, totalApplications: 0, todayApplications: 0, newApplications: 0 };
  }
}

// --- Главное меню ---
const mainMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('💰 Рассчитать стоимость', 'start_quiz')],
  [Markup.button.webApp('👁 Посмотреть работы', 'https://ehhechre.github.io/studio-bot-backend/webapp/')],
  [Markup.button.callback('📞 Связаться с нами', 'contact')]
]);

const mainMenuText = `🚀 Добро пожаловать в нашу студию!\n\n` +
  `🎯 Мы создаем:\n` +
  `• Современные сайты и лендинги\n` +
  `• Мобильные приложения\n` +
  `• Брендинг и дизайн\n` +
  `• Digital-маркетинг\n\n` +
  `✨ Выберите действие:`;

// --- Команды ---
bot.start(async (ctx: TelegramContext) => {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }

    log('info', 'User started bot', { userId: telegramUser.id });

    // Сохраняем пользователя
    await ensureUser(telegramUser);

    // Пробуем отправить с логотипом, если не получится - текст
    try {
      await ctx.replyWithPhoto(
        'AgACAgIAAxkBAAICRWhpw6XXPrldcv1IK2YUf2boX6mxAAL99jEbaHNQS0g_hguljSVZAQADAgADeQADNgQ',
        {
          caption: `🚀 Добро пожаловать в Polli Digital!\n\n` +
                  `Привет, ${telegramUser.first_name}! Мы создаем сайты, которые продают.\n\n` +
                  `🎯 Что можем для вас сделать?`,
          reply_markup: mainMenuKeyboard.reply_markup
        }
      );
      
      log('info', 'Welcome sent with logo', { userId: telegramUser.id });
      
    } catch (photoError) {
      log('warn', 'Failed to send photo, sending text', { error: (photoError as Error).message });
      await ctx.reply(mainMenuText, mainMenuKeyboard);
    }

  } catch (error) {
    log('error', 'Error in start command', { error: (error as Error).message });
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

// --- Дополнительные команды (как в оригинальном коде) ---
bot.command('cases', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
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
  } catch (error) {
    log('error', 'Error in cases command', { error: (error as Error).message });
    await ctx.reply('⚠️ Ошибка загрузки портфолио. Попробуйте позже.');
  }
});

bot.command('app', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
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
  } catch (error) {
    log('error', 'Error in app command', { error: (error as Error).message });
    await ctx.reply('⚠️ Ошибка запуска приложения. Попробуйте позже.');
  }
});
bot.command('admin', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) {
      await ctx.reply('❌ У вас нет прав доступа');
      return;
    }

    await ctx.reply(
      `👨‍💼 Админ панель\n\n` +
      `Доступные команды:\n` +
      `/stats - статистика бота\n` +
      `/status - статус системы`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📊 Статистика', 'admin_stats')],
        [Markup.button.callback('⚙️ Статус системы', 'admin_status')]
      ])
    );

  } catch (error) {
    log('error', 'Error in admin command', { error: (error as Error).message });
  }
});

bot.command('stats', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) return;

    const stats = await getStats();
    const activeSessions = memoryQuizSessions.size;

    await ctx.reply(
      `📊 Статистика бота\n\n` +
      `👥 Всего пользователей: ${stats.totalUsers}\n` +
      `📋 Всего заявок: ${stats.totalApplications}\n` +
      `🆕 Заявок сегодня: ${stats.todayApplications}\n` +
      `⏳ Новых заявок: ${stats.newApplications}\n` +
      `🔄 Активных сессий: ${activeSessions}\n\n` +
      `⏰ Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
    );

  } catch (error) {
    log('error', 'Error in stats command', { error: (error as Error).message });
  }
});

bot.command('status', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) return;

    let dbStatus = '❌ Недоступна';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = '✅ Работает';
    } catch {
      dbStatus = '❌ Ошибка подключения';
    }

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    await ctx.reply(
      `⚙️ Статус системы\n\n` +
      `🗄️ База данных: ${dbStatus}\n` +
      `⏱️ Время работы: ${hours}ч ${minutes}м\n` +
      `💾 Использование памяти: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n` +
      `🔄 Активных сессий: ${memoryQuizSessions.size}\n` +
      `📊 PID процесса: ${process.pid}`
    );

  } catch (error) {
    log('error', 'Error in status command', { error: (error as Error).message });
  }
});

// --- Обработчики кнопок ---
bot.action('start_quiz', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;

    log('info', 'User started quiz', { userId: ctx.from.id });

    // Проверяем активную сессию
    const existingSession = memoryQuizSessions.get(ctx.from.id);
    
    if (existingSession) {
      await ctx.reply(
        `📋 У вас уже есть незавершенный опрос!\n\n` +
        `📍 Текущий вопрос: ${existingSession.currentStep}/4\n\n` +
        `Хотите продолжить или начать заново?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('▶️ Продолжить', 'continue_quiz')],
          [Markup.button.callback('🔄 Начать заново', 'restart_quiz')],
          [Markup.button.callback('◀️ Главное меню', 'main_menu')]
        ])
      );
      return;
    }

    // Согласие на обработку данных
    await ctx.reply(
      `📋 СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ\n\n` +
      `Я даю согласие на обработку моих персональных данных (имя, телефон, Telegram ID) с целью предоставления услуг веб-разработки и связи со мной.\n\n` +
      `Срок хранения данных - 3 года. Я могу отозвать согласие командой /delete_data.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Согласен', 'consent_agree')],
        [Markup.button.callback('❌ Не согласен', 'consent_decline')]
      ])
    );

  } catch (error) {
    log('error', 'Error in start_quiz', { error: (error as Error).message });
    await ctx.reply('❌ Ошибка при запуске опроса');
  }
});

bot.action('consent_agree', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
    log('info', 'User agreed to consent', { userId: ctx.from.id });
    
    // Начинаем новую сессию в памяти
    const session: QuizSession = {
      userId: ctx.from.id.toString(),
      currentStep: 1,
      answers: {},
      startedAt: new Date()
    };

    memoryQuizSessions.set(ctx.from.id, session);
    await sendQuestion1(ctx);

  } catch (error) {
    log('error', 'Error in consent_agree', { error: (error as Error).message });
  }
});

bot.action('consent_decline', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
    log('info', 'User declined consent', { userId: ctx.from.id });
    await ctx.editMessageText(
      `❌ Понял вас. Без согласия мы не можем начать опрос.\n\nЕсли передумаете - нажмите /start`
    );
  } catch (error) {
    log('error', 'Error in consent_decline', { error: (error as Error).message });
  }
});

// Удалена функция view_works - теперь используется прямой webApp

bot.action('contact', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;

    log('info', 'User viewing contacts', { userId: ctx.from.id });

    await ctx.reply(
      `📞 Связаться с нами\n\n` +
      `💬 Telegram: @polli_woww\n` +
      `📱 WhatsApp: +7 (911) 184-80-08\n` +
      `📧 Email: info@newdigital.moscow\n\n` +
      `🌐 Сайт: ${WEBSITE_URL}\n\n` +
      `⏰ Работаем: Пн-Пт 10:00-19:00 МСК`,
      Markup.inlineKeyboard([
        [Markup.button.url('💬 Telegram', 'https://t.me/polli_woww')],
        [Markup.button.url('📱 WhatsApp', 'https://wa.me/79111848008')],
        [Markup.button.callback('◀️ Главное меню', 'main_menu')]
      ])
    );

  } catch (error) {
    log('error', 'Error in contact', { error: (error as Error).message });
  }
});

bot.action('main_menu', async (ctx: TelegramContext) => {
  try {
    await ctx.reply(mainMenuText, mainMenuKeyboard);
  } catch (error) {
    log('error', 'Error returning to main menu', { error: (error as Error).message });
  }
});

// --- Вопросы опроса ---
async function sendQuestion1(ctx: TelegramContext) {
  try {
    if (!ctx.from) return;
    
    const session = memoryQuizSessions.get(ctx.from.id);
    if (session) {
      session.currentStep = 1; // Устанавливаем правильный шаг
    }
    
    await ctx.reply(
      `❓ 1/4: Какой сайт вам нужен?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📄 Лендинг', 'q1_landing')],
        [Markup.button.callback('🌐 Многостраничный сайт', 'q1_multipage')],
        [Markup.button.callback('🛒 Интернет-магазин', 'q1_shop')],
        [Markup.button.callback('🤔 Не знаю — нужна консультация', 'q1_consultation')]
      ])
    );
    
    log('info', 'Question 1 shown', { userId: ctx.from?.id });
  } catch (error) {
    log('error', 'Error in sendQuestion1', { error: (error as Error).message });
  }
}

async function sendQuestion2(ctx: TelegramContext) {
  try {
    if (!ctx.from) return;
    
    const session = memoryQuizSessions.get(ctx.from.id);
    if (session) {
      session.currentStep = 2; // Устанавливаем правильный шаг
    }
    
    await ctx.reply(
      `❓ 2/4: В какой нише вы работаете?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ Услуги', 'q2_services')],
        [Markup.button.callback('🎓 Образование', 'q2_education')],
        [Markup.button.callback('🏗 Строительство', 'q2_construction')],
        [Markup.button.callback('💄 Красота/мода', 'q2_beauty')],
        [Markup.button.callback('🏠 Недвижимость', 'q2_realestate')],
        [Markup.button.callback('✏️ Другое', 'q2_other')]
      ])
    );
    
    log('info', 'Question 2 shown', { userId: ctx.from?.id, step: 2 });
  } catch (error) {
    log('error', 'Error in sendQuestion2', { error: (error as Error).message });
  }
}

async function sendQuestion3(ctx: TelegramContext) {
  try {
    if (!ctx.from) return;
    
    const session = memoryQuizSessions.get(ctx.from.id);
    if (session) {
      session.currentStep = 3; // Устанавливаем правильный шаг
    }
    
    await ctx.reply(
      `❓ 3/4: Есть ли у вас фирменный стиль или логотип?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Да, всё готово', 'q3_ready')],
        [Markup.button.callback('🔄 Частично', 'q3_partial')],
        [Markup.button.callback('❌ Нет, нужно создать с нуля', 'q3_none')]
      ])
    );
    
    log('info', 'Question 3 shown', { userId: ctx.from?.id, step: 3 });
  } catch (error) {
    log('error', 'Error in sendQuestion3', { error: (error as Error).message });
  }
}

async function sendQuestion4(ctx: TelegramContext) {
  try {
    if (!ctx.from) return;
    
    const session = memoryQuizSessions.get(ctx.from.id);
    if (session) {
      session.currentStep = 4; // Устанавливаем правильный шаг
    }
    
    await ctx.reply(`❓ 4/4: Как с вами связаться?\n\n📛 Напишите ваше имя:`);
    log('info', 'Question 4 shown', { userId: ctx.from?.id, step: 4 });
  } catch (error) {
    log('error', 'Error in sendQuestion4', { error: (error as Error).message });
  }
}

async function saveAnswerAndNext(
  ctx: TelegramContext, 
  field: string, 
  value: any, 
  nextFunction: (ctx: TelegramContext) => Promise<void>
) {
  try {
    if (!ctx.from) return;
    
    await ctx.answerCbQuery('✅ Ответ сохранен');
    
    const session = memoryQuizSessions.get(ctx.from.id);
    if (!session) {
      await ctx.reply('❌ Сессия не найдена. Начните заново: /start');
      return;
    }

    // Сохраняем ответ БЕЗ изменения шага здесь
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    session.answers[field] = sanitizedValue;
    
    log('info', 'Answer saved', { 
      userId: ctx.from.id,
      field, 
      value: typeof value === 'string' ? value.slice(0, 50) : value,
      currentStep: session.currentStep 
    });
    
    // Переходим к следующему вопросу ТОЛЬКО через функцию
    setTimeout(() => nextFunction(ctx), 300);
    
  } catch (error) {
    log('error', 'Error in saveAnswerAndNext', { error: (error as Error).message });
    await ctx.reply('❌ Ошибка сохранения ответа. Попробуйте начать сначала: /start');
  }
}

bot.action('continue_quiz', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;

    const session = memoryQuizSessions.get(ctx.from.id);
    if (!session) {
      await ctx.reply('❌ Сессия не найдена. Начните заново: /start');
      return;
    }

    // Показываем текущий вопрос в зависимости от шага
    if (session.currentStep === 1) {
      await sendQuestion1(ctx);
    } else if (session.currentStep === 2) {
      await sendQuestion2(ctx);
    } else if (session.currentStep === 3) {
      await sendQuestion3(ctx);
    } else {
      await sendQuestion4(ctx);
    }
  } catch (error) {
    log('error', 'Error continuing quiz', { error: (error as Error).message });
  }
});

bot.action('restart_quiz', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
    // Удаляем старую сессию и создаем новую
    memoryQuizSessions.delete(ctx.from.id);
    
    const session: QuizSession = {
      userId: ctx.from.id.toString(),
      currentStep: 1,
      answers: {},
      startedAt: new Date()
    };

    memoryQuizSessions.set(ctx.from.id, session);
    await sendQuestion1(ctx);
  } catch (error) {
    log('error', 'Error restarting quiz', { error: (error as Error).message });
  }
});
bot.action('q1_landing', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Лендинг', sendQuestion2));
bot.action('q1_multipage', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Многостраничный сайт', sendQuestion2));
bot.action('q1_shop', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Интернет-магазин', sendQuestion2));
bot.action('q1_consultation', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Нужна консультация', sendQuestion2));

bot.action('q2_services', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Услуги', sendQuestion3));
bot.action('q2_education', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Образование', sendQuestion3));
bot.action('q2_construction', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Строительство', sendQuestion3));
bot.action('q2_beauty', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Красота/мода', sendQuestion3));
bot.action('q2_realestate', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Недвижимость', sendQuestion3));

bot.action('q2_other', async (ctx) => {
  try {
    if (!ctx.from) return;
    
    await ctx.answerCbQuery('✏️ Укажите нишу');
    await ctx.editMessageText('✏️ Напишите вашу нишу текстом (например: "IT", "Медицина", "Юриспруденция"):');
    log('info', 'Custom niche requested', { userId: ctx.from.id });
  } catch (error) {
    log('error', 'Error in q2_other', { error: (error as Error).message });
  }
});

bot.action('q3_ready', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Да, всё готово', sendQuestion4));
bot.action('q3_partial', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Частично', sendQuestion4));
bot.action('q3_none', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Нет, нужно создать с нуля', sendQuestion4));

// --- Обработка кнопки "нет комментария" ---
bot.action('no_comment', async (ctx) => {
  try {
    if (!ctx.from) return;
    
    await ctx.answerCbQuery('✅ Завершаю оформление заявки...');
    await completeApplication(ctx, 'Без комментария');
    
  } catch (error) {
    log('error', 'Error in no_comment', { error: (error as Error).message });
  }
});

// --- Обработка текстовых сообщений ---
bot.on('text', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const messageText = ctx.message.text;
    const sanitizedText = sanitizeInput(messageText);
    const session = memoryQuizSessions.get(ctx.from.id);
    
    if (!session) {
      // Если нет активной сессии, предлагаем главное меню
      await ctx.reply(
        `Спасибо за сообщение! 😊\n\nВоспользуйтесь главным меню:`,
        mainMenuKeyboard
      );
      return;
    }

    log('info', 'Text message in quiz', { 
      userId: ctx.from.id, 
      step: session.currentStep,
      message: messageText.slice(0, 50)
    });

    // Обработка ввода ниши на шаге 2
    if (session.currentStep === 2 && !session.answers.niche) {
      if (sanitizedText.length < 2) {
        await ctx.reply('⚠️ Слишком короткое название ниши. Введите минимум 2 символа.');
        return;
      }
      
      session.answers.niche = sanitizedText;
      session.currentStep = 3; // Явно переходим к шагу 3
      await ctx.reply('✅ Ниша сохранена');
      await sendQuestion3(ctx);
      return;
    }
    
    // Обработка ввода имени на шаге 4
    if (session.currentStep === 4 && !session.answers.contacts) {
      if (!validateName(sanitizedText)) {
        await ctx.reply(
          '⚠️ Пожалуйста, введите корректное имя (2-50 символов, только буквы).\n\n' +
          'Например: "Иван" или "Анна Петрова"'
        );
        return;
      }
      
      session.answers.contacts = { name: sanitizedText };
      
      await ctx.reply('✅ Имя сохранено');
      await ctx.reply(
        '📱 Поделитесь вашим контактом для связи:',
        Markup.keyboard([
          Markup.button.contactRequest('📞 Поделиться контактом')
        ]).resize().oneTime()
      );
      
      log('info', 'Name saved', { userId: ctx.from.id, name: sanitizedText.slice(0, 20), step: 4 });
      return;
    }
    
    // Обработка комментария после получения контакта (остаемся на шаге 4)
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

    // Если ничего не подошло
    await ctx.reply(
      `🤔 Не понял ваше сообщение на текущем этапе (шаг ${session.currentStep}).\n\n` +
      `Попробуйте начать заново: /start`
    );

  } catch (error) {
    log('error', 'Error handling text message', { error: (error as Error).message });
    await ctx.reply('⚠️ Ошибка обработки сообщения. Попробуйте еще раз.');
  }
});

// --- Обработка контакта ---
bot.on('contact', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from || !ctx.message || !('contact' in ctx.message)) return;
    
    const session = memoryQuizSessions.get(ctx.from.id);
    if (!session || !session.answers.contacts) return;
    
    const phoneNumber = ctx.message.contact.phone_number;
    
    // Валидация номера телефона
    if (!validatePhone(phoneNumber)) {
      await ctx.reply(
        '⚠️ Некорректный номер телефона. Попробуйте поделиться контактом еще раз.',
        Markup.removeKeyboard()
      );
      return;
    }
    
    session.answers.contacts.phone = phoneNumber;
    
    log('info', 'Phone saved', { 
      userId: ctx.from.id, 
      phone: phoneNumber.slice(0, 8) + '***',
      isValid: validatePhone(phoneNumber)
    });
    
    await ctx.reply('✅ Контакт получен!', Markup.removeKeyboard());
    
    await ctx.reply(
      '✍️ Есть комментарий к заказу?\n\n💡 Расскажите о ваших пожеланиях, сроках или особенностях проекта.\n\nИли нажмите кнопку ниже:',
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Нет комментария', 'no_comment')]
      ])
    );
    
  } catch (error) {
    log('error', 'Error processing contact', { error: (error as Error).message });
    await ctx.reply('⚠️ Ошибка обработки контакта. Попробуйте еще раз.');
  }
});

// --- Завершение заявки ---
async function completeApplication(ctx: TelegramContext, comment: string) {
  try {
    if (!ctx.from) return;
    
    const session = memoryQuizSessions.get(ctx.from.id);
    if (!session) return;
    
    session.answers.contacts.comment = comment;
    
    // Получаем пользователя
    const user = await getCachedUser(ctx.from.id);
    if (!user) {
      await ctx.reply('❌ Ошибка пользователя. Попробуйте /start');
      return;
    }
    
    // Сохраняем заявку в БД
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
    
    // Удаляем сессию из памяти
    memoryQuizSessions.delete(ctx.from.id);
    
    // Уведомляем в канал
    await notifyChannelNewApplication(application, session.answers, user);
    
    log('info', 'Application completed', { 
      userId: ctx.from.id, 
      applicationId: application?.id,
      hasComment: comment !== 'Без комментария'
    });
    
    await ctx.reply(
      `🎉 Спасибо! Ваша заявка${application ? ` #${application.id}` : ''} принята.\n\n` +
      `📞 Мы свяжемся с вами в течение 2 часов!\n\n` +
      `Пока ждете — посмотрите наши работы:`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('👁 Посмотреть портфолио', 'https://ehhechre.github.io/studio-bot-backend/webapp/')],
        [Markup.button.callback('🏠 Главное меню', 'main_menu')]
      ])
    );
    
  } catch (error) {
    log('error', 'Error completing application', { error: (error as Error).message });
    await ctx.reply('❌ Ошибка при сохранении заявки. Свяжитесь с нами напрямую.');
  }
}

// --- Уведомление в канал (адаптированное из вашего кода) ---
async function notifyChannelNewApplication(application: any, answers: any, user: any) {
  try {
    const contact = answers.contacts || {};
    const isValidPhone = contact.phone ? validatePhone(contact.phone) : false;
    const phoneStatus = isValidPhone ? '✅' : '⚠️';
    
    const message = 
      `🔔 НОВАЯ ЗАЯВКА${application ? ` #${application.id}` : ''}\n\n` +
      `👤 Клиент: ${user.first_name || 'Аноним'} (@${user.username || 'без username'})\n` +
      `📞 Контакты: ${contact.name}, ${contact.phone} ${phoneStatus}\n` +
      `🆔 Telegram ID: ${user.telegram_id}\n\n` +
      `--- Ответы на квиз ---\n` +
      `🌐 Тип сайта: ${answers.site_type || 'Не указано'}\n` +
      `🏢 Ниша: ${answers.niche || 'Не указано'}\n` +
      `🎨 Фирменный стиль: ${answers.brand_style || 'Не указано'}\n` +
      `💬 Комментарий: ${contact.comment || 'Нет'}\n\n` +
      `📊 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;
    
    if (CHANNEL_ID) {
      await bot.telegram.sendMessage(CHANNEL_ID, message);
      log('info', 'Application sent to channel', { 
        channelId: CHANNEL_ID,
        applicationId: application?.id 
      });
    } else {
      log('error', 'CHANNEL_ID not found', {});
    }
  } catch (error) { 
    log('error', 'Failed to notify channel', { error: (error as Error).message });
  }
}

// --- Команда удаления данных ---
bot.command('delete_data', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
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
      
      // Очищаем кеши
      userCache.delete(userId);
      memoryQuizSessions.delete(userId);
      
      log('info', 'User data deleted', { userId });
      
      await ctx.reply(
        `✅ Ваши персональные данные полностью удалены из нашей системы.\n\n` +
        `Удалено:\n` +
        `• Профиль пользователя\n` +
        `• Заявки и контакты\n\n` +
        `Спасибо за использование нашего сервиса!`
      );
    } else {
      await ctx.reply(`ℹ️ Ваши данные не найдены в системе.`);
    }
  } catch (error) {
    log('error', 'Error deleting user data', { error: (error as Error).message });
    await ctx.reply('❌ Ошибка при удалении данных. Обратитесь к администратору.');
  }
});

// --- Админские action кнопки ---
bot.action('admin_stats', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) return;
    
    const stats = await getStats();
    
    await ctx.reply(
      `📊 Детальная статистика\n\n` +
      `👥 Пользователи: ${stats.totalUsers}\n` +
      `📋 Заявки: ${stats.totalApplications}\n` +
      `🆕 Сегодня: ${stats.todayApplications}\n` +
      `⏳ К обработке: ${stats.newApplications}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⚙️ Статус системы', 'admin_status')],
        [Markup.button.callback('◀️ Назад', 'admin_back')]
      ])
    );
  } catch (error) {
    log('error', 'Error in admin_stats action', { error: (error as Error).message });
  }
});

bot.action('admin_status', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) return;
    
    let dbStatus = '❌';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = '✅';
    } catch {
      dbStatus = '❌';
    }

    await ctx.reply(
      `⚙️ Статус системы\n\n` +
      `🗄️ БД: ${dbStatus}\n` +
      `💾 RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB\n` +
      `🔄 Сессии: ${memoryQuizSessions.size}\n` +
      `⏱️ Аптайм: ${Math.floor(process.uptime() / 60)}м`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📊 Статистика', 'admin_stats')],
        [Markup.button.callback('◀️ Назад', 'admin_back')]
      ])
    );
  } catch (error) {
    log('error', 'Error in admin_status action', { error: (error as Error).message });
  }
});

bot.action('admin_back', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from || !isAdmin(ctx.from.id)) return;
    
    await ctx.reply(
      `👨‍💼 Админ панель\n\n` +
      `Доступные команды:\n` +
      `/stats - статистика\n` +
      `/status - статус системы`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📊 Статистика', 'admin_stats')],
        [Markup.button.callback('⚙️ Статус системы', 'admin_status')]
      ])
    );
  } catch (error) {
    log('error', 'Error in admin_back action', { error: (error as Error).message });
  }
});

// --- Обработка ошибок ---
bot.catch((err: unknown, ctx: Context) => {
  const error = err instanceof Error ? err : new Error(String(err));
  log('error', 'Bot error', { 
    error: error.message, 
    userId: (ctx as TelegramContext).from?.id 
  });
});

// --- Health Check ---
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    log('info', 'Database health check: OK');
  } catch (error) {
    log('error', 'Database health check failed', { error: (error as Error).message });
  }
}, 5 * 60 * 1000); // каждые 5 минут

// --- Graceful Shutdown ---
async function gracefulShutdown(signal: string) {
  log('info', `Received ${signal}, shutting down gracefully...`);
  
  try {
    bot.stop(signal);
    await prisma.$disconnect();
    log('info', 'Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    log('error', 'Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
}

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

// --- Запуск ---
async function start() {
  try {
    // Проверяем подключение к БД
    await prisma.$connect();
    log('info', 'Database connected successfully');

    // Устанавливаем команды меню
    await bot.telegram.setMyCommands([
      { command: 'app', description: 'Кейсы' }
    ]);

    // Запускаем бота
    await bot.launch();
    log('info', '🚀 Production Stable Bot v3.0 started successfully!');
    
    log('info', `📊 Active sessions: ${memoryQuizSessions.size}`);
    log('info', `💾 Memory usage: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`);
    log('info', '✅ All systems operational');

  } catch (error) {
    log('error', 'Failed to start bot', { error: (error as Error).message });
    process.exit(1);
  }
}

start();