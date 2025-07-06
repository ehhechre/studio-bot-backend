// src/index.ts - PRODUCTION VERSION БЕЗ ОШИБОК PRISMA
import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// --- Типы ---
interface TelegramContext extends Context {
  from: NonNullable<Context['from']>;
}
type QuizAnswers = { [key: string]: any };

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

// --- Аналитика и логирование ---
const logUserAction = (userId: number, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`📊 [${timestamp}] User ${userId}: ${action}`, data ? JSON.stringify(data) : '');
};

const logError = (error: any, context: string, userId?: number) => {
  const timestamp = new Date().toISOString();
  console.error(`❌ [${timestamp}] ERROR in ${context} ${userId ? `(User: ${userId})` : ''}:`, error);
};

// --- Инициализация ---
dotenv.config();
const prisma = new PrismaClient();
const botToken = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!botToken || !CHANNEL_ID) {
  console.error("🚨 КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN или CHANNEL_ID не найдены в .env!");
  process.exit(1);
}

const bot = new Telegraf<TelegramContext>(botToken);

// --- Middleware для безопасности ---
bot.use(async (ctx, next) => {
  try {
    if (ctx.from) {
      logUserAction(ctx.from.id, 'request', {
        type: ctx.updateType,
        message: 'text' in ctx.message ? ctx.message.text?.slice(0, 100) : undefined
      });
    }
    await next();
  } catch (error) {
    logError(error, 'middleware', ctx.from?.id);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('prisma') || errorMessage.includes('database')) {
      await ctx.reply('🔧 Временные технические работы с базой данных. Попробуйте через несколько минут.');
    } else {
      await ctx.reply('⚠️ Произошла техническая ошибка. Попробуйте позже или обратитесь в поддержку.');
    }
  }
});

// --- Установка команд меню ---
bot.telegram.setMyCommands([
  { command: 'app', description: 'Кейсы' }
]);

// --- Кеширование пользователей ---
const userCache = new Map<number, any>();

const getCachedUser = async (telegramId: number) => {
  try {
    if (userCache.has(telegramId)) {
      return userCache.get(telegramId);
    }
    const user = await prisma.users.findUnique({ where: { telegram_id: telegramId } });
    if (user) {
      userCache.set(telegramId, user);
    }
    return user;
  } catch (error) {
    logError(error, 'getCachedUser', telegramId);
    return null;
  }
};

// --- СТАРТОВОЕ МЕНЮ ---
bot.start(async (ctx) => {
  const startTime = Date.now();
  try {
    const telegramUser = ctx.from;
    logUserAction(telegramUser.id, 'start_command');
    const userInDb = await prisma.user.upsert({
        where: { telegram_id: telegramUser.id },
        update: {
          username: telegramUser.username,
          first_name: telegramUser.first_name
        },
        create: {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          language_code: telegramUser.language_code,
        },
      });
      

    userCache.set(telegramUser.id, userInDb);
    console.log(`🔥 Пользователь: ${userInDb.first_name} (${telegramUser.id})`);

    try {
      console.log('📸 Попытка отправить логотип...');
      await ctx.replyWithPhoto(
        'AgACAgIAAxkBAAICRWhpw6XXPrldcv1IK2YUf2boX6mxAAL99jEbaHNQS0g_hguljSVZAQADAgADeQADNgQ',
        {
          caption: `🚀 Добро пожаловать в Polli Digital!\n\n` +
                  `Привет, ${userInDb.first_name}! Мы создаем сайты, которые продают.\n\n` +
                  `🎯 Что можем для вас сделать?`,
          reply_markup: {
            inline_keyboard: [
              [{ text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' }],
              [{ text: '👁 Посмотреть работы', web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' } }]
            ]
          }
        }
      );
      const loadTime = Date.now() - startTime;
      console.log(`✅ Логотип отправлен за ${loadTime}ms`);
      logUserAction(telegramUser.id, 'welcome_sent', { loadTime, withLogo: true });
    } catch (photoError) {
      logError(photoError, 'photo_send', telegramUser.id);
      console.log('📝 Отправляем текстовое приветствие...');
      await ctx.reply(
        `Здравствуйте! Меня зовут Полина, я консультант студии Polli Digital.\n\n` +
        `Мы создаём бренды, сайты и маркетинг, которые работают на результат и узнаваемость.\n\n` +
        `Буду рада обсудить ваш проект и помочь найти лучшее решение для вашего бизнеса.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' }],
              [{ text: '👁 Посмотреть работы', web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' } }]
            ]
          }
        }
      );
      const loadTime = Date.now() - startTime;
      console.log(`✅ Текстовое приветствие отправлено за ${loadTime}ms`);
      logUserAction(telegramUser.id, 'welcome_sent', { loadTime, withLogo: false });
    }
  } catch (error) {
    logError(error, 'start_command', ctx.from?.id);
    await ctx.reply(
      '⚠️ Произошла техническая ошибка при загрузке. Попробуйте выполнить команду /start еще раз.\n\n' +
      'Если проблема повторится, обратитесь в техподдержку.'
    );
  }
});

// --- КОМАНДЫ МЕНЮ ---
bot.command('cases', async (ctx) => {
  try {
    logUserAction(ctx.from.id, 'cases_command');
    await ctx.reply('👁 Посмотрите наши работы:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎨 Портфолио Polli Digital', web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' } }
        ]]
      }
    });
  } catch (error) {
    logError(error, 'cases_command', ctx.from.id);
    await ctx.reply('⚠️ Ошибка загрузки портфолио. Попробуйте позже.');
  }
});

bot.command('calculate', async (ctx) => {
  try {
    logUserAction(ctx.from.id, 'calculate_command');
    await ctx.reply('💰 Рассчитать стоимость сайта:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '📋 Начать опрос', callback_data: 'start_quiz' }
        ]]
      }
    });
  } catch (error) {
    logError(error, 'calculate_command', ctx.from.id);
    await ctx.reply('⚠️ Ошибка загрузки калькулятора. Попробуйте позже.');
  }
});

bot.command('app', async (ctx) => {
  try {
    logUserAction(ctx.from.id, 'app_command');
    await ctx.reply('🚀 Откройте наше приложение:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎨 Polli Digital App', web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' } }
        ]]
      }
    });
  } catch (error) {
    logError(error, 'app_command', ctx.from.id);
    await ctx.reply('⚠️ Ошибка запуска приложения. Попробуйте позже.');
  }
});

// --- АДМИН КОМАНДЫ ---
const ADMIN_IDS = [443699588];

bot.command('myid', async (ctx) => {
  try {
    await ctx.reply(`🆔 Ваш Telegram ID: \`${ctx.from.id}\``, { parse_mode: 'Markdown' });
    logUserAction(ctx.from.id, 'myid_request');
  } catch (error) {
    logError(error, 'myid_command', ctx.from.id);
  }
});

bot.command('admin_stats', async (ctx) => {
  try {
    if (!ADMIN_IDS.includes(ctx.from.id)) {
      logUserAction(ctx.from.id, 'unauthorized_admin_access');
      await ctx.reply('❌ Недостаточно прав доступа.');
      return;
    }
    logUserAction(ctx.from.id, 'admin_stats_request');
    const [usersCount, applicationsCount, completedQuizzes, todayUsers] = await Promise.all([
      prisma.users.count(),
      prisma.applications.count(),
      prisma.quiz_sessions.count({ where: { is_completed: true } }),
      prisma.users.count({
        where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
      })
    ]);
    const conversionRate = usersCount > 0 ? ((applicationsCount / usersCount) * 100).toFixed(1) : '0';
    await ctx.reply(
      `📊 СТАТИСТИКА БОТА\n\n` +
      `👥 Всего пользователей: ${usersCount}\n` +
      `🆕 Новых сегодня: ${todayUsers}\n` +
      `📋 Заявок отправлено: ${applicationsCount}\n` +
      `✅ Квизов завершено: ${completedQuizzes}\n` +
      `📈 Конверсия в заявку: ${conversionRate}%\n\n` +
      `⚡ Команды:\n` +
      `/admin_users - список пользователей\n` +
      `/admin_applications - последние заявки\n` +
      `/admin_health - статус системы`
    );
  } catch (error) {
    logError(error, 'admin_stats', ctx.from.id);
    await ctx.reply('❌ Ошибка получения статистики.');
  }
});

bot.command('admin_users', async (ctx) => {
  try {
    if (!ADMIN_IDS.includes(ctx.from.id)) return;
    logUserAction(ctx.from.id, 'admin_users_request');
    const users = await prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      take: 10
    });
    let message = `👥 ПОСЛЕДНИЕ 10 ПОЛЬЗОВАТЕЛЕЙ:\n\n`;
    users.forEach((user, index) => {
      const date = user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
      const isRecent = user.created_at && (new Date().getTime() - new Date(user.created_at).getTime()) < 24 * 60 * 60 * 1000;
      message += `${index + 1}. ${user.first_name || 'Аноним'} (@${user.username || '?'})\n`;
      message += `   🆔 ${user.telegram_id} | 📅 ${date} ${isRecent ? '🟢' : '🔘'}\n\n`;
    });
    await ctx.reply(message);
  } catch (error) {
    logError(error, 'admin_users', ctx.from.id);
    await ctx.reply('❌ Ошибка получения пользователей.');
  }
});

bot.command('admin_applications', async (ctx) => {
  try {
    if (!ADMIN_IDS.includes(ctx.from.id)) return;
    logUserAction(ctx.from.id, 'admin_applications_request');
    const applications = await prisma.applications.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' },
      take: 5
    });
    let message = `📋 ПОСЛЕДНИЕ 5 ЗАЯВОК:\n\n`;
    applications.forEach((app, index) => {
      const date = app.created_at ? new Date(app.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
      const answers = app.answers as any;
      const isValidPhone = answers.contacts?.phone ? validatePhone(answers.contacts.phone) : false;
      message += `${index + 1}. ${app.user.first_name} - ${date}\n`;
      message += `   🌐 Тип: ${answers.site_type || '?'}\n`;
      message += `   🏢 Ниша: ${answers.niche || '?'}\n`;
      message += `   🎨 Стиль: ${answers.brand_style || '?'}\n`;
      message += `   📞 Контакт: ${answers.contacts?.phone || '?'} ${isValidPhone ? '✅' : '⚠️'}\n`;
      message += `   💬 Комментарий: ${answers.contacts?.comment || 'Нет'}\n\n`;
    });
    await ctx.reply(message);
  } catch (error) {
    logError(error, 'admin_applications', ctx.from.id);
    await ctx.reply('❌ Ошибка получения заявок.');
  }
});

bot.command('admin_health', async (ctx) => {
  try {
    if (!ADMIN_IDS.includes(ctx.from.id)) return;
    logUserAction(ctx.from.id, 'admin_health_request');
    const startTime = Date.now();
    const dbTest = await prisma.users.count();
    const dbTime = Date.now() - startTime;
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const formatBytes = (bytes: number) => {
      return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    };
    await ctx.reply(
      `🔧 СОСТОЯНИЕ СИСТЕМЫ\n\n` +
      `⏱️ Время работы: ${Math.floor(uptime / 3600)}ч ${Math.floor((uptime % 3600) / 60)}м\n` +
      `🗄️ База данных: ${dbTime}ms (${dbTest} пользователей)\n` +
      `💾 Память: ${formatBytes(memUsage.heapUsed)} / ${formatBytes(memUsage.heapTotal)}\n` +
      `📊 Кеш пользователей: ${userCache.size} записей\n` +
      `✅ Статус: Система работает нормально`
    );
  } catch (error) {
    logError(error, 'admin_health', ctx.from.id);
    await ctx.reply('❌ Ошибка проверки состояния системы.');
  }
});

// --- СОГЛАСИЕ НА ОБРАБОТКУ ДАННЫХ ---
bot.action('start_quiz', async (ctx) => {
  try {
    logUserAction(ctx.from.id, 'quiz_start_requested');
    await ctx.reply(
      `📋 СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ\n\n` +
      `Я даю согласие на обработку моих персональных данных (имя, телефон, Telegram ID) с целью предоставления услуг веб-разработки и связи со мной. Срок хранения данных - 3 года.\n\n` +
      `Я могу отозвать согласие в любой момент командой /delete_data.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Согласен', callback_data: 'consent_agree' }],
            [{ text: '❌ Не согласен', callback_data: 'consent_decline' }]
          ]
        }
      }
    );
  } catch (error) {
    logError(error, 'start_quiz_action', ctx.from.id);
    await ctx.reply('⚠️ Ошибка загрузки формы согласия. Попробуйте позже.');
  }
});

bot.action('consent_decline', async (ctx) => {
  try {
    logUserAction(ctx.from.id, 'consent_declined');
    await ctx.reply(`❌ Понял вас. Без согласия мы не можем начать опрос.\n\nЕсли передумаете - нажмите /start`);
  } catch (error) {
    logError(error, 'consent_decline_action', ctx.from.id);
  }
});

// --- ЛОГИКА КВИЗА ---
bot.action('consent_agree', async (ctx) => {
  try {
    logUserAction(ctx.from.id, 'consent_agreed');
    await ctx.reply('⏳ Подготавливаю опрос...');
    const user = await getCachedUser(ctx.from.id);
    if (!user) {
      await ctx.reply('❌ Пользователь не найден. Выполните /start');
      return;
    }
    await prisma.quiz_sessions.deleteMany({
      where: { user_id: user.id, is_completed: false }
    });
    const session = await prisma.quiz_sessions.create({
      data: { user_id: user.id, current_step: 1, answers: {} },
    });
    logUserAction(ctx.from.id, 'quiz_session_created', { sessionId: session.id });
    await sendQuestion1(ctx);
  } catch (error) {
    logError(error, 'consent_agree_action', ctx.from.id);
    await ctx.reply('❌ Ошибка при создании сессии опроса. Попробуйте начать сначала: /start');
  }
});

async function saveAnswerAndNext(
  ctx: TelegramContext,
  field: string,
  value: any,
  nextFunction: (ctx: TelegramContext) => Promise<void>
) {
  try {
    await ctx.answerCbQuery('✅ Ответ сохранен');
    const user = await getCachedUser(ctx.from.id);
    if (!user) throw new Error('Пользователь не найден');
    const session = await prisma.quiz_sessions.findFirst({
      where: { user_id: user.id, is_completed: false },
      orderBy: { created_at: 'desc' },
    });
    if (!session) throw new Error('Активная сессия не найдена');
    const currentAnswers = (session.answers as QuizAnswers) || {};
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    const updatedAnswers = { ...currentAnswers, [field]: sanitizedValue };
    await prisma.quiz_sessions.update({
      where: { id: session.id },
      data: {
        answers: updatedAnswers,
        current_step: (session.current_step || 1) + 1
      },
    });
    logUserAction(ctx.from.id, 'quiz_answer_saved', {
      field,
      value: typeof value === 'string' ? value.slice(0, 50) : value,
      step: (session.current_step || 1) + 1
    });
    setTimeout(() => nextFunction(ctx), 300);
  } catch (error) {
    logError(error, 'saveAnswerAndNext', ctx.from.id);
    await ctx.reply('❌ Ошибка сохранения ответа. Попробуйте начать сначала: /start');
  }
}

// --- ВОПРОСЫ КВИЗА ---
async function sendQuestion1(ctx: TelegramContext) {
  try {
    await ctx.reply(`❓ 1/4: Какой сайт вам нужен?`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📄 Лендинг', callback_data: 'q1_landing' }],
          [{ text: '🌐 Многостраничный сайт', callback_data: 'q1_multipage' }],
          [{ text: '🛒 Интернет-магазин', callback_data: 'q1_shop' }],
          [{ text: '🤔 Не знаю — нужна консультация', callback_data: 'q1_consultation' }]
        ]
      }
    });
    logUserAction(ctx.from.id, 'quiz_question_1_shown');
  } catch (error) {
    logError(error, 'sendQuestion1', ctx.from.id);
  }
}

bot.action('q1_landing', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Лендинг', sendQuestion2));
bot.action('q1_multipage', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Многостраничный сайт', sendQuestion2));
bot.action('q1_shop', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Интернет-магазин', sendQuestion2));
bot.action('q1_consultation', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Нужна консультация', sendQuestion2));

async function sendQuestion2(ctx: TelegramContext) {
  try {
    await ctx.reply(`❓ 2/4: В какой нише вы работаете?`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚙️ Услуги', callback_data: 'q2_services' }],
          [{ text: '🎓 Образование', callback_data: 'q2_education' }],
          [{ text: '🏗 Строительство', callback_data: 'q2_construction' }],
          [{ text: '💄 Красота/мода', callback_data: 'q2_beauty' }],
          [{ text: '🏠 Недвижимость', callback_data: 'q2_realestate' }],
          [{ text: '✏️ Другое', callback_data: 'q2_other' }]
        ]
      }
    });
    logUserAction(ctx.from.id, 'quiz_question_2_shown');
  } catch (error) {
    logError(error, 'sendQuestion2', ctx.from.id);
  }
}

bot.action('q2_services', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Услуги', sendQuestion3));
bot.action('q2_education', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Образование', sendQuestion3));
bot.action('q2_construction', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Строительство', sendQuestion3));
bot.action('q2_beauty', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Красота/мода', sendQuestion3));
bot.action('q2_realestate', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Недвижимость', sendQuestion3));

bot.action('q2_other', async (ctx) => {
  try {
    await ctx.answerCbQuery('✏️ Укажите нишу');
    await ctx.reply('✏️ Напишите вашу нишу текстом (например: "IT", "Медицина", "Юриспруденция"):');
    logUserAction(ctx.from.id, 'quiz_question_2_custom_requested');
  } catch (error) {
    logError(error, 'q2_other_action', ctx.from.id);
  }
});

async function sendQuestion3(ctx: TelegramContext) {
  try {
    await ctx.reply(`❓ 3/4: Есть ли у вас фирменный стиль или логотип?`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Да, всё готово', callback_data: 'q3_ready' }],
          [{ text: '🔄 Частично', callback_data: 'q3_partial' }],
          [{ text: '❌ Нет, нужно создать с нуля', callback_data: 'q3_none' }]
        ]
      }
    });
    logUserAction(ctx.from.id, 'quiz_question_3_shown');
  } catch (error) {
    logError(error, 'sendQuestion3', ctx.from.id);
  }
}

bot.action('q3_ready', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Да, всё готово', sendQuestion4));
bot.action('q3_partial', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Частично', sendQuestion4));
bot.action('q3_none', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Нет, нужно создать с нуля', sendQuestion4));

async function sendQuestion4(ctx: TelegramContext) {
  try {
    await ctx.reply(`❓ 4/4: Как с вами связаться?\n\n📛 Напишите ваше имя:`);
    logUserAction(ctx.from.id, 'quiz_question_4_shown');
  } catch (error) {
    logError(error, 'sendQuestion4', ctx.from.id);
  }
}

// --- ОБРАБОТКА КНОПКИ "НЕТ КОММЕНТАРИЯ" ---
bot.action('no_comment', async (ctx) => {
  try {
    await ctx.answerCbQuery('✅ Завершаю оформление заявки...');
    const user = await getCachedUser(ctx.from.id);
    if (!user) return;
    const session = await prisma.quiz_sessions.findFirst({
      where: { user_id: user.id, is_completed: false },
      orderBy: { created_at: 'desc' },
    });
    if (!session) return;
    const currentAnswers = (session.answers as any) || {};
    if (currentAnswers.contacts && currentAnswers.contacts.phone) {
      currentAnswers.contacts.comment = 'Без комментария';
      await prisma.quiz_sessions.update({
        data: { answers: currentAnswers, is_completed: true },
        where: { id: session.id }
      });
      const application = await prisma.applications.create({
        data: {
          user_id: user.id,
          status: 'new',
          answers: currentAnswers,
          contact_info: `${currentAnswers.contacts.name}, ${currentAnswers.contacts.phone}`,
        },
        include: { user: true },
      });
      logUserAction(ctx.from.id, 'application_completed', {
        applicationId: application.id,
        hasComment: false
      });
      await notifyChannelNewApplication(application);
      await ctx.editMessageText(
        `🎉 Спасибо! Ваша заявка #${application.id} принята. Мы скоро свяжемся с вами.\n\n` +
        `Пока ждете — посмотрите наши работы:`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '👁 Посмотреть портфолио', web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' } }
            ]]
          }
        }
      );
    }
  } catch (error) {
    logError(error, 'no_comment_action', ctx.from.id);
    await ctx.reply('❌ Ошибка при обработке заявки. Попробуйте начать сначала: /start');
  }
});

// --- ОБРАБОТКА ТЕКСТА ---
bot.on('text', async (ctx) => {
  try {
    const user = await getCachedUser(ctx.from.id);
    if (!user) return;
    const session = await prisma.quiz_sessions.findFirst({
      where: { user_id: user.id, is_completed: false },
      orderBy: { created_at: 'desc' },
    });
    if (!session || !('text' in ctx.message)) return;
    const messageText = ctx.message.text;
    const sanitizedText = sanitizeInput(messageText);
    const currentAnswers = (session.answers as any) || {};
    if (session.current_step === 2 && !currentAnswers.niche) {
      if (sanitizedText.length < 2) {
        await ctx.reply('⚠️ Слишком короткое название ниши. Введите минимум 2 символа.');
        return;
      }
      await ctx.reply('✅ Ниша сохранена');
      await saveAnswerAndNext(ctx, 'niche', sanitizedText, sendQuestion3);
      return;
    }
    if (session.current_step === 4 && !currentAnswers.contacts) {
      if (!validateName(sanitizedText)) {
        await ctx.reply(
          '⚠️ Пожалуйста, введите корректное имя (2-50 символов, только буквы).\n\n' +
          'Например: "Иван" или "Анна Петрова"'
        );
        return;
      }
      currentAnswers.contacts = { name: sanitizedText };
      await prisma.quiz_sessions.update({
        data: { answers: currentAnswers },
        where: { id: session.id }
      });
      await ctx.reply('✅ Имя сохранено');
      await ctx.reply(
        '📱 Поделитесь вашим контактом для связи:',
        Markup.keyboard([
          Markup.button.contactRequest('📞 Поделиться контактом')
        ]).resize().oneTime()
      );
      logUserAction(ctx.from.id, 'quiz_name_saved', { name: sanitizedText.slice(0, 20) });
      return;
    }
    if (session.current_step === 4 && currentAnswers.contacts && currentAnswers.contacts.phone && !currentAnswers.contacts.comment) {
      if (sanitizedText.length > 1000) {
        await ctx.reply('⚠️ Комментарий слишком длинный. Максимум 1000 символов.');
        return;
      }
      currentAnswers.contacts.comment = sanitizedText;
      await ctx.reply('✅ Комментарий сохранен. Оформляю заявку...');
      await prisma.quiz_sessions.update({
        data: { answers: currentAnswers, is_completed: true },
        where: { id: session.id }
      });
      const application = await prisma.applications.create({
        data: {
          user_id: user.id,
          status: 'new',
          answers: currentAnswers,
          contact_info: `${currentAnswers.contacts.name}, ${currentAnswers.contacts.phone}`,
        },
        include: { user: true },
      });
      logUserAction(ctx.from.id, 'application_completed', {
        applicationId: application.id,
        hasComment: true,
        commentLength: sanitizedText.length
      });
      await notifyChannelNewApplication(application);
      await ctx.reply(
        `🎉 Спасибо! Ваша заявка #${application.id} принята. Мы скоро свяжемся с вами.\n\n` +
        `Пока ждете — посмотрите наши работы:`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '👁 Посмотреть портфолио', web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' } }
            ]]
          }
        }
      );
    }
  } catch (error) {
    logError(error, 'text_processing', ctx.from?.id);
    await ctx.reply('⚠️ Ошибка обработки сообщения. Попробуйте еще раз.');
  }
});

// --- ОБРАБОТКА КОНТАКТА ---
bot.on('contact', async (ctx) => {
  try {
    const user = await getCachedUser(ctx.from.id);
    if (!user) return;
    const session = await prisma.quiz_sessions.findFirst({
      where: { user_id: user.id, is_completed: false },
      orderBy: { created_at: 'desc' },
    });
    if (!session) return;
    const currentAnswers = (session.answers as any) || {};
    const phoneNumber = ctx.message.contact.phone_number;
    if (currentAnswers.contacts && !currentAnswers.contacts.phone) {
      if (!validatePhone(phoneNumber)) {
        await ctx.reply(
          '⚠️ Некорректный номер телефона. Попробуйте поделиться контактом еще раз или введите номер вручную.',
          Markup.removeKeyboard()
        );
        return;
      }
      currentAnswers.contacts.phone = phoneNumber;
      await prisma.quiz_sessions.update({
        data: { answers: currentAnswers },
        where: { id: session.id }
      });
      logUserAction(ctx.from.id, 'quiz_phone_saved', {
        phone: phoneNumber.slice(0, 8) + '***',
        isValid: validatePhone(phoneNumber)
      });
      await ctx.reply('✅ Контакт получен!', Markup.removeKeyboard());
      await ctx.reply(
        '✍️ Есть комментарий к заказу?\n\n💡 Расскажите о ваших пожеланиях, сроках или особенностях проекта.\n\nИли нажмите кнопку ниже:',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '✅ Нет комментария', callback_data: 'no_comment' }
            ]]
          }
        }
      );
    }
  } catch (error) {
    logError(error, 'contact_processing', ctx.from?.id);
    await ctx.reply('⚠️ Ошибка обработки контакта. Попробуйте еще раз.');
  }
});

// --- КОМАНДА УДАЛЕНИЯ ДАННЫХ ---
bot.command('delete_data', async (ctx) => {
  try {
    const userId = ctx.from.id;
    logUserAction(userId, 'delete_data_requested');
    const userToDelete = await prisma.users.findUnique({
      where: { telegram_id: userId }
    });
    if (userToDelete) {
      await prisma.quiz_sessions.deleteMany({ where: { user_id: userToDelete.id } });
      await prisma.applications.deleteMany({ where: { user_id: userToDelete.id } });
      await prisma.users.delete({ where: { telegram_id: userId } });
      userCache.delete(userId);
      logUserAction(userId, 'user_data_deleted');
      console.log(`🗑️ Удалены данные пользователя: ${userId}`);
      await ctx.reply(
        `✅ Ваши персональные данные полностью удалены из нашей системы.\n\n` +
        `Удалено:\n` +
        `• Профиль пользователя\n` +
        `• История опросов\n` +
        `• Заявки и контакты\n\n` +
        `Спасибо за использование нашего сервиса!`
      );
    } else {
      await ctx.reply(`ℹ️ Ваши данные не найдены в системе.`);
    }
  } catch (error) {
    logError(error, 'delete_data_command', ctx.from.id);
    await ctx.reply('❌ Ошибка при удалении данных. Обратитесь к администратору.');
  }
});

// --- ФУНКЦИЯ УВЕДОМЛЕНИЙ В КАНАЛ ---
async function notifyChannelNewApplication(application: any) {
  try {
    const { user, answers } = application;
    const contact = answers.contacts || {};
    const isValidPhone = contact.phone ? validatePhone(contact.phone) : false;
    const phoneStatus = isValidPhone ? '✅' : '⚠️';
    const message =
      `🔔 НОВАЯ ЗАЯВКА #${application.id}\n\n` +
      `👤 Клиент: ${user.first_name || 'Аноним'} (@${user.username || 'без username'})\n` +
      `📞 Контакты: ${contact.name}, ${contact.phone} ${phoneStatus}\n` +
      `🆔 Telegram ID: ${user.telegram_id}\n\n` +
      `--- Ответы на квиз ---\n` +
      `🌐 Тип сайта: ${answers.site_type || 'Не указано'}\n` +
      `🏢 Ниша: ${answers.niche || 'Не указано'}\n` +
      `🎨 Фирменный стиль: ${answers.brand_style || 'Не указано'}\n` +
      `💬 Комментарий: ${contact.comment || 'Нет'}\n\n` +
      `📊 Время: ${new Date().toLocaleString('ru-RU')}`;
    if (CHANNEL_ID) {
      await bot.telegram.sendMessage(CHANNEL_ID, message);
      console.log(`✅ Уведомление о заявке #${application.id} отправлено в канал`);
    } else {
      console.error('❌ CHANNEL_ID не найден в .env файле!');
    }
  } catch (error) {
    logError(error, 'notifyChannelNewApplication', application?.user?.telegram_id);
  }
}

// --- ОБРАБОТКА НЕПЕРЕХВАЧЕННЫХ ОШИБОК ---
process.on('uncaughtException', (error) => {
  logError(error, 'uncaughtException');
  console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА - перезапуск приложения может потребоваться');
});

process.on('unhandledRejection', (reason, promise) => {
  logError(reason, 'unhandledRejection');
  console.error('🚨 Необработанное отклонение промиса:', promise);
});

// --- ЗАПУСК БОТА ---
bot.launch().then(async () => {
  console.log('🚀 Production bot v2.1 запущен успешно!');
  try {
    await prisma.users.count();
    console.log('✅ Соединение с базой данных установлено');
  } catch (error) {
    console.error('❌ ОШИБКА подключения к базе данных:', error);
    console.log('⚠️ Бот запущен, но база данных недоступна');
  }
  try {
    const result = await bot.telegram.callApi('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Кейсы',
        web_app: { url: 'https://polli-digital.ru/portfolio' }
      }
    });
    console.log('🔥 КНОПКА "КЕЙСЫ" УСТАНОВЛЕНА НА ОСНОВНОЙ САЙТ!');
  } catch (error) {
    logError(error, 'setChatMenuButton');
    try {
      await bot.telegram.setChatMenuButton(undefined, {
        type: 'web_app',
        text: 'Кейсы',
        web_app: { url: 'https://polli-digital.ru/portfolio' }
      });
      console.log('🔥 КНОПКА "КЕЙСЫ" УСТАНОВЛЕНА НА ОСНОВНОЙ САЙТ (способ 2)!');
    } catch (error2) {
      logError(error2, 'setChatMenuButton_fallback');
      console.log('⚠️ Не удалось установить кнопку меню - используйте команды');
    }
  }
  const memUsage = process.memoryUsage();
  console.log(`💾 Память: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 Кеш пользователей: ${userCache.size} записей`);
  console.log('✅ Все системы готовы к работе!');
}).catch(error => {
  console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА при запуске бота:', error);
  process.exit(1);
});

process.once('SIGINT', () => {
  console.log('🛑 Получен сигнал SIGINT - корректное завершение...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM - корректное завершение...');
  bot.stop('SIGTERM');
});