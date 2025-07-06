// src/index.ts - ЧИСТАЯ версия БЕЗ ДУБЛЕЙ

// --- Импорты ---
import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// --- Типы ---
interface TelegramContext extends Context {
  from: NonNullable<Context['from']>;
}
type QuizAnswers = { [key: string]: any };

// --- Инициализация ---
dotenv.config();
const prisma = new PrismaClient();
const botToken = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!botToken || !CHANNEL_ID) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN или CHANNEL_ID не найдены в .env!");
  process.exit(1);
}

const bot = new Telegraf<TelegramContext>(botToken);

// --- УСТАНОВКА КОМАНД МЕНЮ ---
bot.telegram.setMyCommands([
  { command: 'start', description: '🏠 Главное меню' },
  { command: 'cases', description: '👁 Посмотреть работы' },
  { command: 'calculate', description: '💰 Рассчитать стоимость' },
  { command: 'app', description: '🚀 Открыть приложение' }
]);

// --- СТАРТОВОЕ МЕНЮ ---
bot.start(async (ctx) => {
  try {
    const telegramUser = ctx.from;
    const userInDb = await prisma.user.upsert({
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

    console.log(`🔥 Новый пользователь: ${userInDb.first_name} (${telegramUser.id})`);

    // Пробуем отправить логотип, если не получается - отправляем текст
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
      console.log('✅ Логотип отправлен успешно!');
      
    } catch (photoError) {
      console.log('❌ Ошибка отправки логотипа:', photoError.message);
      console.log('📝 Отправляем текстовое приветствие...');
      
      // Fallback - отправляем красивое текстовое приветствие
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
      console.log('✅ Текстовое приветствие отправлено!');
    }
  } catch (error) {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА в /start:', error);
    await ctx.reply('Ой, что-то пошло не так. Попробуйте еще раз позже.');
  }
});

// --- КОМАНДЫ МЕНЮ ---
bot.command('cases', (ctx) => {
  ctx.reply('👁 Посмотрите наши работы:', {
    reply_markup: {
      inline_keyboard: [[
        { 
          text: '🎨 Портфолио Polli Digital', 
          web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' }
        }
      ]]
    }
  });
});

bot.command('calculate', (ctx) => {
  ctx.reply('💰 Рассчитать стоимость сайта:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '📋 Начать опрос', callback_data: 'start_quiz' }
      ]]
    }
  });
});

bot.command('app', (ctx) => {
  ctx.reply('🚀 Откройте наше приложение:', {
    reply_markup: {
      inline_keyboard: [[
        { 
          text: '🎨 Polli Digital App', 
          web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' }
        }
      ]]
    }
  });
});

// --- АДМИН КОМАНДЫ ---
const ADMIN_IDS = [443699588]; // ID Игоря

bot.command('myid', async (ctx) => {
  await ctx.reply(`Ваш Telegram ID: ${ctx.from.id}`);
  console.log(`ID пользователя ${ctx.from.first_name}: ${ctx.from.id}`);
});

bot.command('admin_stats', async (ctx) => {
  try {
    if (!ADMIN_IDS.includes(ctx.from.id)) {
      await ctx.reply('❌ У вас нет прав администратора.');
      return;
    }

    const usersCount = await prisma.user.count();
    const applicationsCount = await prisma.application.count();
    const completedQuizzes = await prisma.quizSession.count({ where: { is_completed: true } });

    await ctx.reply(
      `📊 СТАТИСТИКА БОТА\n\n` +
      `👥 Всего пользователей: ${usersCount}\n` +
      `📋 Заявок отправлено: ${applicationsCount}\n` +
      `✅ Квизов завершено: ${completedQuizzes}\n\n` +
      `Команды:\n` +
      `/admin_users - список пользователей\n` +
      `/admin_applications - последние заявки`
    );
  } catch (error) {
    console.error('Ошибка статистики:', error);
    await ctx.reply('❌ Ошибка получения статистики.');
  }
});

bot.command('admin_users', async (ctx) => {
  try {
    if (!ADMIN_IDS.includes(ctx.from.id)) return;

    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      take: 10
    });

    let message = `👥 ПОСЛЕДНИЕ 10 ПОЛЬЗОВАТЕЛЕЙ:\n\n`;
    
    users.forEach((user, index) => {
      const date = user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
      message += `${index + 1}. ${user.first_name || 'Аноним'} (@${user.username || '?'})\n`;
      message += `   ID: ${user.telegram_id} | ${date}\n\n`;
    });

    await ctx.reply(message);
  } catch (error) {
    console.error('Ошибка списка пользователей:', error);
    await ctx.reply('❌ Ошибка получения пользователей.');
  }
});

bot.command('admin_applications', async (ctx) => {
  try {
    if (!ADMIN_IDS.includes(ctx.from.id)) return;

    const applications = await prisma.application.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    let message = `📋 ПОСЛЕДНИЕ 5 ЗАЯВОК:\n\n`;
    
    applications.forEach((app, index) => {
      const date = app.created_at ? new Date(app.created_at).toLocaleDateString('ru-RU') : 'Неизвестно';
      const answers = app.answers as any;
      message += `${index + 1}. ${app.user.first_name} - ${date}\n`;
      message += `   Тип: ${answers.site_type || '?'}\n`;
      message += `   Ниша: ${answers.niche || '?'}\n`;
      message += `   Стиль: ${answers.brand_style || '?'}\n`;
      message += `   Контакт: ${answers.contacts?.phone || '?'}\n`;
      message += `   Комментарий: ${answers.contacts?.comment || 'Нет'}\n\n`;
    });

    await ctx.reply(message);
  } catch (error) {
    console.error('Ошибка списка заявок:', error);
    await ctx.reply('❌ Ошибка получения заявок.');
  }
});

// --- СОГЛАСИЕ НА ОБРАБОТКУ ДАННЫХ ---
bot.action('start_quiz', (ctx) => {
  ctx.reply(
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
});

bot.action('consent_decline', async (ctx) => {
  await ctx.reply(`❌ Понял вас. Без согласия мы не можем начать опрос.\n\nЕсли передумаете - нажмите /start`);
});

// --- ЛОГИКА КВИЗА ---
bot.action('consent_agree', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
    if (!user) throw new Error('Пользователь не найден');
    
    // Удаляем старые незавершенные сессии этого пользователя
    await prisma.quizSession.deleteMany({ where: { user_id: user.id, is_completed: false }});

    // Создаем новую сессию
    await prisma.quizSession.create({
      data: { user_id: user.id, current_step: 1, answers: {} },
    });
    await sendQuestion1(ctx);
  } catch (error) {
    console.error('Ошибка при создании сессии квиза:', error);
    await ctx.reply('Произошла ошибка, попробуйте начать сначала: /start');
  }
});

async function saveAnswerAndNext(ctx: TelegramContext, field: string, value: any, nextFunction: (ctx: TelegramContext) => Promise<void>) {
  try {
    const user = await prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
    if (!user) throw new Error('Пользователь не найден');
    const session = await prisma.quizSession.findFirst({
      where: { user_id: user.id, is_completed: false },
      orderBy: { created_at: 'desc' },
    });
    if (!session) throw new Error('Активная сессия не найдена');
    const currentAnswers = (session.answers as QuizAnswers) || {};
    const updatedAnswers = { ...currentAnswers, [field]: value };
    await prisma.quizSession.update({
      where: { id: session.id },
      data: { answers: updatedAnswers, current_step: (session.current_step || 0) + 1 },
    });
    await nextFunction(ctx);
  } catch (error) {
    console.error('Ошибка при сохранении ответа:', error);
    await ctx.reply('Произошла ошибка, попробуйте начать сначала: /start');
  }
}

// --- ВОПРОСЫ КВИЗА ---

// Вопрос 1: Какой сайт вам нужен?
async function sendQuestion1(ctx: TelegramContext) {
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
}

bot.action('q1_landing', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Лендинг', sendQuestion2));
bot.action('q1_multipage', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Многостраничный сайт', sendQuestion2));
bot.action('q1_shop', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Интернет-магазин', sendQuestion2));
bot.action('q1_consultation', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Нужна консультация', sendQuestion2));

// Вопрос 2: В какой нише работаете?
async function sendQuestion2(ctx: TelegramContext) {
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
}

bot.action('q2_services', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Услуги', sendQuestion3));
bot.action('q2_education', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Образование', sendQuestion3));
bot.action('q2_construction', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Строительство', sendQuestion3));
bot.action('q2_beauty', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Красота/мода', sendQuestion3));
bot.action('q2_realestate', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Недвижимость', sendQuestion3));
bot.action('q2_other', (ctx) => ctx.reply('✏️ Напишите вашу нишу текстом:'));

// Вопрос 3: Есть ли фирменный стиль?
async function sendQuestion3(ctx: TelegramContext) {
  await ctx.reply(`❓ 3/4: Есть ли у вас фирменный стиль или логотип?`, { 
    reply_markup: { 
      inline_keyboard: [
        [{ text: '✅ Да, всё готово', callback_data: 'q3_ready' }],
        [{ text: '🔄 Частично', callback_data: 'q3_partial' }],
        [{ text: '❌ Нет, нужно создать с нуля', callback_data: 'q3_none' }]
      ]
    }
  });
}

bot.action('q3_ready', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Да, всё готово', sendQuestion4));
bot.action('q3_partial', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Частично', sendQuestion4));
bot.action('q3_none', (ctx) => saveAnswerAndNext(ctx, 'brand_style', 'Нет, нужно создать с нуля', sendQuestion4));

// Вопрос 4: Контакты
async function sendQuestion4(ctx: TelegramContext) {
  await ctx.reply(`❓ 4/4: Как с вами связаться?\n\n📛 Напишите ваше имя:`);
}

// --- ОБРАБОТКА КНОПКИ "НЕТ КОММЕНТАРИЯ" ---
bot.action('no_comment', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
    if (!user) return;
    
    const session = await prisma.quizSession.findFirst({
      where: { user_id: user.id, is_completed: false },
      orderBy: { created_at: 'desc' },
    });
    
    if (!session) return;
    
    const currentAnswers = (session.answers as any) || {};
    
    if (currentAnswers.contacts && currentAnswers.contacts.phone) {
      currentAnswers.contacts.comment = 'Без комментария';
      
      await prisma.quizSession.update({ 
        data: { answers: currentAnswers, is_completed: true }, 
        where: { id: session.id } 
      });
      
      const application = await prisma.application.create({
        data: {
          user_id: user.id,
          status: 'new',
          answers: currentAnswers,
          contact_info: `${currentAnswers.contacts.name}, ${currentAnswers.contacts.phone}`,
        },
        include: { user: true },
      });
      
      console.log('Квиз завершен без комментария, заявка создана');
      await notifyChannelNewApplication(application);
      
      await ctx.editMessageText(
        `🎉 Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.\n\n` +
        `Пока ждете — посмотрите наши работы:`,
        {
          reply_markup: {
            inline_keyboard: [[
              { 
                text: '👁 Посмотреть портфолио', 
                web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' }
              }
            ]]
          }
        }
      );
    }
  } catch (error) {
    console.error('Ошибка при обработке "нет комментария":', error);
    await ctx.reply('Произошла ошибка, попробуйте начать сначала: /start');
  }
});

// --- ОБРАБОТКА ТЕКСТА ---
bot.on('text', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
    if (!user) return;
    const session = await prisma.quizSession.findFirst({
      where: { user_id: user.id, is_completed: false },
      orderBy: { created_at: 'desc' },
    });
    if (!session || !('text' in ctx.message)) return;
    const currentAnswers = (session.answers as any) || {};
    
    // Обработка ввода ниши на шаге 2
    if (session.current_step === 2 && !currentAnswers.niche) {
      await saveAnswerAndNext(ctx, 'niche', ctx.message.text, sendQuestion3);
      return;
    }
    
    // Обработка ввода имени на шаге 4
    if (session.current_step === 4 && !currentAnswers.contacts) {
      currentAnswers.contacts = { name: ctx.message.text };
      await prisma.quizSession.update({ data: { answers: currentAnswers }, where: { id: session.id } });
      await ctx.reply(
        '📱 Поделитесь вашим контактом для связи:',
        Markup.keyboard([ Markup.button.contactRequest('📞 Поделиться контактом') ]).resize().oneTime()
      );
      return;
    }
    
    // Обработка комментария после получения контакта
    if (session.current_step === 4 && currentAnswers.contacts && currentAnswers.contacts.phone && !currentAnswers.contacts.comment) {
      currentAnswers.contacts.comment = ctx.message.text;
      
      await prisma.quizSession.update({ 
        data: { answers: currentAnswers, is_completed: true }, 
        where: { id: session.id } 
      });
      
      const application = await prisma.application.create({
        data: {
          user_id: user.id,
          status: 'new',
          answers: currentAnswers,
          contact_info: `${currentAnswers.contacts.name}, ${currentAnswers.contacts.phone}`,
        },
        include: { user: true },
      });
      
      console.log('Квиз завершен с комментарием, заявка создана');
      await notifyChannelNewApplication(application);
      
      await ctx.reply(
        `🎉 Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.\n\n` +
        `Пока ждете — посмотрите наши работы:`,
        {
          reply_markup: {
            inline_keyboard: [[
              { 
                text: '👁 Посмотреть портфолио', 
                web_app: { url: 'https://ehhechre.github.io/studio-bot-backend/webapp/' }
              }
            ]]
          }
        }
      );
    }
  } catch (error) {
    console.error('Ошибка при обработке текста:', error);
  }
});
  
// --- ОБРАБОТКА КОНТАКТА ---
bot.on('contact', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
    if (!user) return;
    
    const session = await prisma.quizSession.findFirst({
      where: { user_id: user.id, is_completed: false },
      orderBy: { created_at: 'desc' },
    });
    
    if (!session) return;
    
    const currentAnswers = (session.answers as any) || {};
    
    if (currentAnswers.contacts && !currentAnswers.contacts.phone) {
      currentAnswers.contacts.phone = ctx.message.contact.phone_number;
      
      await prisma.quizSession.update({ 
        data: { answers: currentAnswers }, 
        where: { id: session.id } 
      });
      
      await ctx.reply(
        '✍️ Есть комментарий к заказу?\n\nНапишите ваши пожелания или нажмите кнопку ниже:',
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
    console.error('Ошибка при обработке контакта:', error);
  }
});
  
// --- КОМАНДА УДАЛЕНИЯ ДАННЫХ ---
bot.command('delete_data', async (ctx) => {
  try {
    const userId = ctx.from.id;
    const userToDelete = await prisma.user.findUnique({ where: { telegram_id: userId }});
    if (userToDelete) {
        await prisma.quizSession.deleteMany({ where: { user_id: userToDelete.id } });
        await prisma.application.deleteMany({ where: { user_id: userToDelete.id } });
        await prisma.user.delete({ where: { telegram_id: userId } });
        console.log(`Удалены данные пользователя: ${userId}`);
        await ctx.reply(`✅ Ваши персональные данные удалены из нашей системы.`);
    } else {
        await ctx.reply(`Ваши данные не найдены в системе.`);
    }
  } catch (error) {
    console.error('Ошибка удаления данных:', error);
    await ctx.reply('❌ Ошибка при удалении данных. Обратитесь к администратору.');
  }
});

// --- ФУНКЦИЯ ДЛЯ ОТПРАВКИ УВЕДОМЛЕНИЯ В КАНАЛ ---
async function notifyChannelNewApplication(application: any) {
  try {
    const { user, answers } = application;
    const contact = answers.contacts || {};
    const message = 
      `🔔 НОВАЯ ЗАЯВКА!\n\n` +
      `👤 Клиент: ${user.first_name || 'Аноним'} (@${user.username || '?'})\n` +
      `📞 Контакты: ${contact.name}, ${contact.phone}\n\n` +
      `--- Ответы на квиз ---\n`+
      `🌐 Тип сайта: ${answers.site_type || '?'}\n` +
      `🏢 Ниша: ${answers.niche || '?'}\n` +
      `🎨 Фирменный стиль: ${answers.brand_style || '?'}\n` +
      `💬 Комментарий: ${contact.comment || 'Нет'}`;
    
    if (CHANNEL_ID) {
        await bot.telegram.sendMessage(CHANNEL_ID, message);
        console.log('✅ Уведомление в канал отправлено!');
    } else {
        console.error('❌ CHANNEL_ID не найден в .env файле!');
    }
  } catch (error) { 
    console.error('❌ ОШИБКА отправки в канал:', error); 
  }
}

// --- ЗАПУСК БОТА ---
bot.launch().then(() => {
  console.log('✅ Бот успешно запущен!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));