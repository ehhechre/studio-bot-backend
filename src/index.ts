// src/index.ts - ИСПРАВЛЕНО ПОД РЕАЛЬНУЮ СТРУКТУРУ БД

import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// --- Типы ---
interface TelegramContext extends Context {
  from?: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  };
}

interface UserCache {
  [key: number]: {
    id: string;
    telegram_id: bigint;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    language_code: string | null;
    created_at: Date | null;
  };
}

// --- Конфигурация ---
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const CASES_BUTTON_TO_SITE = process.env.CASES_BUTTON_TO_SITE === 'true';

if (!BOT_TOKEN) {
  throw new Error('❌ BOT_TOKEN не найден в .env файле');
}

if (!DATABASE_URL) {
  throw new Error('❌ DATABASE_URL не найден в .env файле');
}

// --- Инициализация ---
const bot = new Telegraf(BOT_TOKEN);
const prisma = new PrismaClient();
const userCache: UserCache = {};

// --- Утилиты ---
function formatMemoryUsage(): string {
  const used = process.memoryUsage();
  return `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`;
}

function logUserAction(userId: number, action: string, details?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`📊 [${timestamp}] User ${userId}: ${action}${details ? ` ${JSON.stringify(details)}` : ''}`);
}

function logError(error: Error, context: string, userId?: number): void {
  const timestamp = new Date().toISOString();
  console.log(`❌ [${timestamp}] ERROR in ${context}${userId ? ` (User: ${userId})` : ''}: ${error.name}:`);
  console.log(error.message);
  if (error.stack) {
    console.log(error.stack.split('\n').slice(0, 5).join('\n'));
  }
}

// --- Команды ---
bot.start(async (ctx: TelegramContext) => {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }

    logUserAction(telegramUser.id, 'start_command');

    // ИСПРАВЛЕНО: используем правильное имя таблицы
    const userInDb = await prisma.users.upsert({
      where: { telegram_id: BigInt(telegramUser.id) },
      update: {
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        language_code: telegramUser.language_code || null
      },
      create: {
        telegram_id: BigInt(telegramUser.id),
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        language_code: telegramUser.language_code || null
      }
    });

    // Обновляем кеш
    userCache[telegramUser.id] = userInDb;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📋 Заполнить анкету', 'fill_form')],
      [Markup.button.callback('💼 Кейсы', 'cases')],
      [Markup.button.callback('📞 Связаться с нами', 'contact')]
    ]);

    await ctx.reply(
      `👋 Добро пожаловать в Polli Digital!\n\n` +
      `🎯 Мы специализируемся на:\n` +
      `• Брендинг и фирменный стиль\n` +
      `• Создание сайтов и приложений\n` +
      `• Digital-маркетинг и реклама\n\n` +
      `✨ Выберите действие:`,
      keyboard
    );

  } catch (error) {
    logError(error as Error, 'start_command', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

// --- Обработчики кнопок ---
bot.action('fill_form', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
    logUserAction(ctx.from.id, 'button_click', { button: 'fill_form' });

    // ИСПРАВЛЕНО: правильное имя таблицы
    const existingSession = await prisma.quiz_sessions.findFirst({
      where: {
        user_id: userCache[ctx.from.id]?.id,
        completed_at: null
      }
    });

    if (existingSession) {
      await ctx.editMessageText(
        `📋 У вас уже есть незавершенная анкета!\n\n` +
        `📍 Текущий этап: ${existingSession.current_step || 1}\n\n` +
        `Хотите продолжить или начать заново?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('▶️ Продолжить', 'continue_form')],
          [Markup.button.callback('🔄 Начать заново', 'restart_form')],
          [Markup.button.callback('◀️ Назад', 'back_to_menu')]
        ])
      );
      return;
    }

    // ИСПРАВЛЕНО: правильное имя таблицы
    const session = await prisma.quiz_sessions.create({
      data: {
        user_id: userCache[ctx.from.id].id,
        current_step: 1,
        answers: {}
      }
    });

    await ctx.editMessageText(
      `📋 Анкета для брифа\n\n` +
      `📌 Шаг 1 из 10\n\n` +
      `❓ Как вас зовут? (имя и фамилия)`,
      Markup.inlineKeyboard([
        [Markup.button.callback('◀️ Назад в меню', 'back_to_menu')]
      ])
    );

  } catch (error) {
    logError(error as Error, 'fill_form_action', ctx.from?.id);
    await ctx.reply('❌ Ошибка при создании анкеты');
  }
});

bot.action('continue_form', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;

    // ИСПРАВЛЕНО: правильное имя таблицы
    const session = await prisma.quiz_sessions.findFirst({
      where: {
        user_id: userCache[ctx.from.id]?.id,
        completed_at: null
      }
    });

    if (!session) {
      await ctx.editMessageText('❌ Сессия не найдена');
      return;
    }

    const currentStep = session.current_step || 1;
    const questions = getQuestions();
    
    if (currentStep <= questions.length) {
      await ctx.editMessageText(
        `📋 Анкета для брифа\n\n` +
        `📌 Шаг ${currentStep} из ${questions.length}\n\n` +
        `❓ ${questions[currentStep - 1]}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('◀️ Назад в меню', 'back_to_menu')]
        ])
      );
    }

  } catch (error) {
    logError(error as Error, 'continue_form_action', ctx.from?.id);
  }
});

bot.action('restart_form', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;

    // ИСПРАВЛЕНО: правильное имя таблицы
    await prisma.quiz_sessions.deleteMany({
      where: {
        user_id: userCache[ctx.from.id]?.id,
        completed_at: null
      }
    });

    // ИСПРАВЛЕНО: правильное имя таблицы
    await prisma.quiz_sessions.create({
      data: {
        user_id: userCache[ctx.from.id].id,
        current_step: 1,
        answers: {}
      }
    });

    await ctx.editMessageText(
      `📋 Анкета для брифа\n\n` +
      `📌 Шаг 1 из 10\n\n` +
      `❓ Как вас зовут? (имя и фамилия)`,
      Markup.inlineKeyboard([
        [Markup.button.callback('◀️ Назад в меню', 'back_to_menu')]
      ])
    );

  } catch (error) {
    logError(error as Error, 'restart_form_action', ctx.from?.id);
  }
});

bot.action('cases', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
    logUserAction(ctx.from.id, 'button_click', { button: 'cases' });

    if (CASES_BUTTON_TO_SITE) {
      await ctx.editMessageText(
        `💼 Наши кейсы\n\n` +
        `🌟 Более 500 успешных проектов!\n\n` +
        `📱 Посмотрите примеры наших работ на сайте:`,
        Markup.inlineKeyboard([
          [Markup.button.url('🌐 Открыть кейсы на сайте', 'https://newdigital.moscow/cases')],
          [Markup.button.callback('◀️ Назад в меню', 'back_to_menu')]
        ])
      );
    } else {
      await ctx.editMessageText(
        `💼 Наши кейсы\n\n` +
        `🌟 Более 500 успешных проектов!\n\n` +
        `🎯 Направления:\n` +
        `• Создание сайтов и лендингов\n` +
        `• Мобильные приложения\n` +
        `• Брендинг и дизайн\n` +
        `• Интернет-маркетинг\n\n` +
        `📞 Свяжитесь с нами для просмотра портфолио!`,
        Markup.inlineKeyboard([
          [Markup.button.callback('📞 Связаться', 'contact')],
          [Markup.button.callback('◀️ Назад в меню', 'back_to_menu')]
        ])
      );
    }

  } catch (error) {
    logError(error as Error, 'cases_action', ctx.from?.id);
  }
});

bot.action('contact', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;
    
    logUserAction(ctx.from.id, 'button_click', { button: 'contact' });

    await ctx.editMessageText(
      `📞 Связаться с нами\n\n` +
      `💬 Telegram: @polli_woww\n` +
      `📱 WhatsApp: +7 (911) 184-80-08\n` +
      `📧 Email: info@newdigital.moscow\n\n` +
      `🌐 Сайт: newdigital.moscow\n\n` +
      `📍 Адрес: Москва, Армянский пер., 11/2А`,
      Markup.inlineKeyboard([
        [Markup.button.url('💬 Telegram', 'https://t.me/polli_woww')],
        [Markup.button.url('📱 WhatsApp', 'https://wa.me/79111848008')],
        [Markup.button.callback('◀️ Назад в меню', 'back_to_menu')]
      ])
    );

  } catch (error) {
    logError(error as Error, 'contact_action', ctx.from?.id);
  }
});

bot.action('back_to_menu', async (ctx: TelegramContext) => {
  try {
    await ctx.editMessageText(
      `👋 Добро пожаловать в Polli Digital!\n\n` +
      `🎯 Мы специализируемся на:\n` +
      `• Брендинг и фирменный стиль\n` +
      `• Создание сайтов и приложений\n` +
      `• Digital-маркетинг и реклама\n\n` +
      `✨ Выберите действие:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📋 Заполнить анкету', 'fill_form')],
        [Markup.button.callback('💼 Кейсы', 'cases')],
        [Markup.button.callback('📞 Связаться с нами', 'contact')]
      ])
    );
  } catch (error) {
    logError(error as Error, 'back_to_menu_action', ctx.from?.id);
  }
});

// --- Обработка текстовых сообщений ---
bot.on('text', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;

    logUserAction(ctx.from.id, 'message', { message: ctx.message?.text });

    // ИСПРАВЛЕНО: правильное имя таблицы
    const session = await prisma.quiz_sessions.findFirst({
      where: {
        user_id: userCache[ctx.from.id]?.id,
        completed_at: null
      }
    });

    if (session) {
      await handleQuizAnswer(ctx, session);
    } else {
      await ctx.reply(
        `Спасибо за сообщение! 😊\n\n` +
        `Для быстрой связи используйте /start`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Главное меню', 'back_to_menu')]
        ])
      );
    }

  } catch (error) {
    logError(error as Error, 'text_handler', ctx.from?.id);
  }
});

// --- Обработка ответов анкеты ---
async function handleQuizAnswer(ctx: TelegramContext, session: any) {
  try {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const answer = ctx.message.text;
    const currentStep = session.current_step || 1;
    const questions = getQuestions();

    // Сохраняем ответ
    const answers = session.answers || {};
    answers[`step_${currentStep}`] = answer;

    if (currentStep >= questions.length) {
      // ИСПРАВЛЕНО: правильное имя таблицы
      await prisma.quiz_sessions.update({
        where: { id: session.id },
        data: {
          answers: answers,
          completed_at: new Date()
        }
      });

      // ИСПРАВЛЕНО: правильное имя таблицы
      await prisma.applications.create({
        data: {
          user_id: userCache[ctx.from.id].id,
          form_data: answers,
          status: 'NEW'
        }
      });

      await ctx.reply(
        `✅ Спасибо! Анкета заполнена.\n\n` +
        `📞 Мы свяжемся с вами в ближайшее время!\n\n` +
        `💬 Если есть вопросы - пишите @polli_woww`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🏠 Главное меню', 'back_to_menu')]
        ])
      );

    } else {
      const nextStep = currentStep + 1;
      
      // ИСПРАВЛЕНО: правильное имя таблицы
      await prisma.quiz_sessions.update({
        where: { id: session.id },
        data: {
          current_step: nextStep,
          answers: answers
        }
      });

      await ctx.reply(
        `📋 Анкета для брифа\n\n` +
        `📌 Шаг ${nextStep} из ${questions.length}\n\n` +
        `❓ ${questions[nextStep - 1]}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('◀️ Назад в меню', 'back_to_menu')]
        ])
      );
    }

  } catch (error) {
    logError(error as Error, 'handleQuizAnswer', ctx.from?.id);
  }
}

// --- Вопросы анкеты ---
function getQuestions(): string[] {
  return [
    "Как вас зовут? (имя и фамилия)",
    "Название вашей компании/проекта?",
    "Какую услугу вас интересует?",
    "Опишите ваш бизнес в 2-3 предложениях",
    "Какая ваша целевая аудитория?",
    "Есть ли у вас фирменный стиль?",
    "Какие у вас есть примеры дизайна, который вам нравится?",
    "Какой планируемый бюджет проекта?",
    "В какие сроки планируете реализацию?",
    "Как с вами связаться? (телефон, email, telegram)"
  ];
}

// --- Команда /admin ---
bot.command('admin', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;

    const adminIds = [7080992269]; // ID администраторов
    if (!adminIds.includes(ctx.from.id)) {
      await ctx.reply('❌ У вас нет прав администратора');
      return;
    }

    // ИСПРАВЛЕНО: правильное имя таблицы
    const usersCount = await prisma.users.count();
    const applicationsCount = await prisma.applications.count();
    const activeSessionsCount = await prisma.quiz_sessions.count({
      where: { completed_at: null }
    });

    await ctx.reply(
      `👨‍💼 Панель администратора\n\n` +
      `👥 Пользователей: ${usersCount}\n` +
      `📋 Заявок: ${applicationsCount}\n` +
      `🔄 Активных анкет: ${activeSessionsCount}\n` +
      `💾 Память: ${formatMemoryUsage()}\n` +
      `📊 Кеш: ${Object.keys(userCache).length} записей`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📋 Последние заявки', 'admin_applications')],
        [Markup.button.callback('🗑 Очистить кеш', 'admin_clear_cache')],
        [Markup.button.callback('🔄 Перезагрузить', 'admin_restart')]
      ])
    );

  } catch (error) {
    logError(error as Error, 'admin_command', ctx.from?.id);
  }
});

bot.action('admin_applications', async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) return;

    // ИСПРАВЛЕНО: правильное имя таблицы
    const applications = await prisma.applications.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { users: true }
    });

    let message = '📋 Последние 5 заявок:\n\n';
    
    applications.forEach((app: any, index: number) => {
      const userData = app.users;
      message += `${index + 1}. ${userData?.first_name || 'Без имени'} (@${userData?.username || 'нет'})\n`;
      message += `   📅 ${app.created_at.toLocaleDateString('ru')}\n\n`;
    });

    await ctx.editMessageText(message, Markup.inlineKeyboard([
      [Markup.button.callback('◀️ Назад', 'admin_back')]
    ]));

  } catch (error) {
    logError(error as Error, 'admin_applications_action', ctx.from?.id);
  }
});

// --- Обработка ошибок ---
bot.catch((err: Error, ctx: Context) => {
  logError(err, 'bot_error', (ctx as TelegramContext).from?.id);
});

// --- Graceful shutdown ---
process.once('SIGINT', () => {
  console.log('🛑 Получен сигнал SIGINT - корректное завершение...');
  bot.stop('SIGINT');
  prisma.$disconnect();
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM - корректное завершение...');
  bot.stop('SIGTERM');
  prisma.$disconnect();
  process.exit(0);
});

// --- Запуск бота ---
bot.launch().then(() => {
  console.log('🚀 Production bot v2.2 запущен успешно!');
  console.log(`🔥 КНОПКА "КЕЙСЫ" УСТАНОВЛЕНА НА ОСНОВНОЙ САЙТ!`, CASES_BUTTON_TO_SITE);
  console.log(`💾 Память: ${formatMemoryUsage()}`);
  console.log(`📊 Кеш пользователей: ${Object.keys(userCache).length} записей`);
  console.log('✅ Все системы готовы к работе!');
}).catch((error) => {
  console.error('❌ Ошибка запуска бота:', error);
  process.exit(1);
});