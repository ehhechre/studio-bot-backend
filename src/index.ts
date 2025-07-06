import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { QUIZ_QUESTIONS } from './quiz-questions';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const CASES_BUTTON_TO_SITE = process.env.CASES_BUTTON_TO_SITE === 'true';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID_FOR_NOTIFY;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!BOT_TOKEN) throw new Error('❌ BOT_TOKEN не найден в .env файле');
if (!DATABASE_URL) throw new Error('❌ DATABASE_URL не найден в .env файле');

const prisma = new PrismaClient();
console.log('Prisma client:', prisma ? 'Initialized' : 'Not initialized');
console.log('Prisma users model:', prisma.users ? 'Available' : 'Not available');
prisma.$connect()
  .then(() => console.log('✅ Успешное подключение к базе данных'))
  .catch((err) => console.error('❌ Ошибка подключения к базе данных:', err));

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

interface TelegramContext {
  from?: TelegramUser;
  reply: (text: string, extra?: any) => Promise<any>;
  editMessageText: (text: string, extra?: any) => Promise<any>;
}

const userCache: { [key: number]: any } = {};

function logUserAction(userId: number, action: string) {
  console.log(`📊 User ${userId}: ${action}`);
}

function logError(error: Error, action: string, userId?: number) {
  console.error(`❌ [${new Date().toISOString()}] ERROR in ${action} (User: ${userId || 'unknown'}):`, error);
}

async function startQuiz(ctx: TelegramContext) {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }

    const userId = ctx.from.id;
    if (!userCache[userId]) {
      await ctx.reply('❌ Пользователь не найден в кэше. Начните с /start');
      return;
    }

    const existingSession = await prisma.quiz_sessions.findFirst({
      where: { user_id: userCache[userId].id, is_completed: false },
    });

    if (existingSession) {
      const currentQuestion = QUIZ_QUESTIONS[existingSession.current_step];
      await ctx.reply(
        currentQuestion.question,
        Markup.inlineKeyboard(currentQuestion.options.map((option, index) => [
          Markup.button.callback(option, `quiz_${index}`),
        ]))
      );
    } else {
      await prisma.quiz_sessions.create({
        data: {
          user_id: userCache[userId].id,
          current_step: 0,
          answers: {},
        },
      });
      await ctx.reply(
        QUIZ_QUESTIONS[0].question,
        Markup.inlineKeyboard(QUIZ_QUESTIONS[0].options.map((option, index) => [
          Markup.button.callback(option, `quiz_${index}`),
        ]))
      );
    }
  } catch (error) {
    logError(error as Error, 'start_quiz', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
}

async function handleQuizAnswer(ctx: TelegramContext, answerIndex: number) {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }

    const userId = ctx.from.id;
    if (!userCache[userId]) {
      await ctx.reply('❌ Пользователь не найден в кэше. Начните с /start');
      return;
    }

    const session = await prisma.quiz_sessions.findFirst({
      where: { user_id: userCache[userId].id, is_completed: false },
    });

    if (!session) {
      await ctx.reply('❌ Сессия анкеты не найдена. Начните заново с /start');
      return;
    }

    const currentStep = session.current_step;
    const answers = session.answers as { [key: string]: string };
    answers[currentStep] = QUIZ_QUESTIONS[currentStep].options[answerIndex];

    const nextStep = currentStep + 1;

    if (nextStep >= QUIZ_QUESTIONS.length) {
      await prisma.quiz_sessions.update({
        where: { id: session.id },
        data: { is_completed: true, completed_at: new Date(), answers },
      });

      await prisma.applications.create({
        data: {
          user_id: userCache[userId].id,
          answers,
          status: 'new',
          contact_info: ctx.from.username || ctx.from.first_name || 'unknown',
          source: 'bot',
        },
      });

      await ctx.editMessageText('✅ Анкета завершена! Спасибо за ваши ответы.');
    } else {
      await prisma.quiz_sessions.update({
        where: { id: session.id },
        data: { current_step: nextStep, answers },
      });

      await ctx.editMessageText(
        QUIZ_QUESTIONS[nextStep].question,
        Markup.inlineKeyboard(QUIZ_QUESTIONS[nextStep].options.map((option, index) => [
          Markup.button.callback(option, `quiz_${index}`),
        ]))
      );
    }
  } catch (error) {
    logError(error as Error, 'handle_quiz_answer', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx: TelegramContext) => {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }

    logUserAction(ctx.from.id, 'start_command');

    if (!prisma.users) {
      throw new Error('❌ Prisma users model is not defined');
    }

    const telegramUser = ctx.from;
    const userInDb = await prisma.users.upsert({
      where: { telegram_id: BigInt(telegramUser.id) },
      update: {
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        language_code: telegramUser.language_code || null,
      },
      create: {
        telegram_id: BigInt(telegramUser.id),
        username: telegramUser.username || null,
        first_name: telegramUser.first_name || null,
        last_name: telegramUser.last_name || null,
        language_code: telegramUser.language_code || null,
      },
    });

    userCache[telegramUser.id] = userInDb;

    const buttons: InlineKeyboardButton[][] = [
      [Markup.button.callback('📋 Заполнить анкету', 'fill_form')],
      CASES_BUTTON_TO_SITE
        ? [Markup.button.url('💼 Кейсы', 'https://newdigital.moscow/cases')]
        : [Markup.button.callback('💼 Кейсы', 'cases')],
      [Markup.button.callback('📞 Связаться с нами', 'contact')],
    ];

    await ctx.reply(
      `👋 Добро пожаловать в Polli Digital!\n\n` +
      `🎯 Мы специализируемся на:\n` +
      `• Брендинг и фирменный стиль\n` +
      `• Создание сайтов и приложений\n` +
      `• Digital-маркетинг и реклама\n\n` +
      `✨ Выберите действие:`,
      Markup.inlineKeyboard(buttons)
    );
  } catch (error) {
    logError(error as Error, 'start_command', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

bot.action('fill_form', async (ctx) => {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }
    logUserAction(ctx.from.id, 'fill_form');
    await startQuiz(ctx);
  } catch (error) {
    logError(error as Error, 'fill_form', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

bot.action('cases', async (ctx) => {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }
    logUserAction(ctx.from.id, 'cases');
    await ctx.editMessageText(
      `💼 Наши кейсы\n\n🌟 Более 500 успешных проектов!`,
      Markup.inlineKeyboard([
        [Markup.button.url('🌐 Кейсы', 'https://newdigital.moscow/cases')],
        [Markup.button.callback('◀️ Назад', 'back_to_menu')],
      ])
    );
  } catch (error) {
    logError(error as Error, 'cases', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

bot.action('contact', async (ctx) => {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }
    logUserAction(ctx.from.id, 'contact');
    await ctx.editMessageText(
      `📞 Связаться с нами\n\n` +
      `💬 Telegram: @polli_woww\n` +
      `📱 WhatsApp: +7 (911) 184-80-08\n` +
      `📧 Email: info@newdigital.moscow\n` +
      `🌐 Сайт: newdigital.moscow\n` +
      `📍 Москва, Армянский пер., 11/2А`,
      Markup.inlineKeyboard([
        [Markup.button.url('💬 Telegram', 'https://t.me/polli_woww')],
        [Markup.button.url('📱 WhatsApp', 'https://wa.me/79111848008')],
        [Markup.button.callback('◀️ Назад', 'back_to_menu')],
      ])
    );
  } catch (error) {
    logError(error as Error, 'contact', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

bot.action('back_to_menu', async (ctx) => {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }
    logUserAction(ctx.from.id, 'back_to_menu');
    const buttons: InlineKeyboardButton[][] = [
      [Markup.button.callback('📋 Заполнить анкету', 'fill_form')],
      CASES_BUTTON_TO_SITE
        ? [Markup.button.url('💼 Кейсы', 'https://newdigital.moscow/cases')]
        : [Markup.button.callback('💼 Кейсы', 'cases')],
      [Markup.button.callback('📞 Связаться с нами', 'contact')],
    ];

    await ctx.editMessageText(
      `👋 Добро пожаловать в Polli Digital!\n\n` +
      `🎯 Мы специализируемся на:\n` +
      `• Брендинг и фирменный стиль\n` +
      `• Создание сайтов и приложений\n` +
      `• Digital-маркетинг и реклама\n\n` +
      `✨ Выберите действие:`,
      Markup.inlineKeyboard(buttons)
    );
  } catch (error) {
    logError(error as Error, 'back_to_menu', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

bot.action(/quiz_(.+)/, async (ctx) => {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }
    const answerIndex = parseInt(ctx.match[1]);
    logUserAction(ctx.from.id, `quiz_answer_${answerIndex}`);
    await handleQuizAnswer(ctx, answerIndex);
  } catch (error) {
    logError(error as Error, 'quiz_answer', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

bot.on('text', async (ctx) => {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Ошибка получения данных пользователя');
      return;
    }
    logUserAction(ctx.from.id, 'text_message');
    await ctx.reply(
      `Спасибо за сообщение! 😊\nИспользуйте /start для навигации`,
      Markup.inlineKeyboard([[Markup.button.callback('🏠 Главное меню', 'back_to_menu')]])
    );
  } catch (error) {
    logError(error as Error, 'text_message', ctx.from?.id);
    await ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

bot.catch((err, ctx) => {
  logError(err as Error, 'global_error', ctx.from?.id);
});

bot.launch().then(() => {
  console.log('🚀 Production bot v2.5 запущен успешно!');
  console.log('🔥 КНОПКА "КЕЙСЫ" УСТАНОВЛЕНА НА ОСНОВНОЙ САЙТ!', CASES_BUTTON_TO_SITE);
  console.log(`💾 Память: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 Кеш пользователей: ${Object.keys(userCache).length} записей`);
  console.log('✅ Все системы готовы к работе!');
});

process.once('SIGINT', () => {
  console.log('🛑 Получен сигнал SIGINT - корректное завершение...');
  bot.stop('SIGINT');
  prisma.$disconnect();
});

process.once('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM - корректное завершение...');
  bot.stop('SIGTERM');
  prisma.$disconnect();
});