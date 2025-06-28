// src/index.ts - УПРОЩЕННАЯ ВЕРСИЯ: Квиз + Уведомления в канал

// --- Импорты ---
import { Telegraf, Context } from 'telegraf';
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
const CHANNEL_ID = process.env.CHANNEL_ID; // <-- Новая переменная для канала



// Проверяем, что все нужные переменные есть
if (!botToken || !CHANNEL_ID) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN или CHANNEL_ID не найдены в .env!");
  process.exit(1);
}

const bot = new Telegraf<TelegramContext>(botToken);

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

    await ctx.reply(
      `Привет, ${userInDb.first_name}! 🚀\n\nВыберите действие:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' }],
            [{ text: '👁 Посмотреть работы', callback_data: 'view_portfolio' }]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Ошибка в /start:', error);
    await ctx.reply('Ой, что-то пошло не так. Попробуйте еще раз позже.');
  }
});

// --- ОБРАБОТЧИКИ ГЛАВНОГО МЕНЮ ---
bot.action('view_portfolio', (ctx) => {
  ctx.reply(`📱 Наше портфолио: https://ваш-сайт.ru`, {
    reply_markup: { inline_keyboard: [[{ text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' }]]}
  });
});

bot.action('start_quiz', (ctx) => {
    ctx.reply(
      `📋 СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ\n\n` +
      `Я даю согласие ИП/ООО "Ваша студия" на обработку моих персональных данных:\n\n` +
      `📝 Обрабатываемые данные: имя, телефон, Telegram ID\n` +
      `🎯 Цель: предоставление услуг веб-разработки и связь с клиентом\n` +
      `⏰ Срок хранения: 3 года с момента получения\n` +
      `🔒 Способы: сбор, запись, хранение, использование\n` +
      `❌ Право отозвать: команда /delete_data\n\n` +
      `С условиями ознакомлен(а) и согласен(на)`,
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
// Обработка отказа от согласия
bot.action('consent_decline', async (ctx) => {
    await ctx.reply(
      `❌ Без согласия на обработку персональных данных мы не можем предоставить услуги.\n\n` +
      `Если передумаете - нажмите /start`
    );
  });
  // Обработка отказа от согласия
bot.action('consent_decline', async (ctx) => {
    await ctx.reply(
      `❌ Без согласия на обработку персональных данных мы не можем предоставить услуги.\n\n` +
      `Если передумаете - нажмите /start`
    );
  });

  // Команда удаления персональных данных
bot.command('delete_data', async (ctx) => {
    try {
      const userId = ctx.from.id;
      
      // Удаляем все данные пользователя
      await prisma.quizSession.deleteMany({ where: { user: { telegram_id: userId } } });
      await prisma.application.deleteMany({ where: { user: { telegram_id: userId } } });
      await prisma.user.delete({ where: { telegram_id: userId } });
      
      await ctx.reply(
        `✅ Ваши персональные данные удалены из нашей системы.\n\n` +
        `Если захотите воспользоваться услугами снова - нажмите /start`
      );
      
      console.log(`Удалены данные пользователя: ${userId}`);
    } catch (error) {
      console.error('Ошибка удаления данных:', error);
      await ctx.reply('❌ Ошибка при удалении данных. Обратитесь к администратору.');
    }
  });
  
// --- ЛОГИКА КВИЗА ---
bot.action('consent_agree', async (ctx) => {
  try {
    const user = await prisma.user.findUnique({ where: { telegram_id: ctx.from.id } });
    if (!user) throw new Error('Пользователь не найден');
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

// --- Вопросы квиза ---
async function sendQuestion1(ctx: TelegramContext) {
  await ctx.reply(`❓ 1/3: Какой сайт вам нужен?`, { reply_markup: { inline_keyboard: [[{ text: '📄 Лендинг', callback_data: 'q1_landing' }], [{ text: '🛒 Магазин', callback_data: 'q1_shop' }]]}});
}
bot.action('q1_landing', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Лендинг', sendQuestion2));
bot.action('q1_shop', (ctx) => saveAnswerAndNext(ctx, 'site_type', 'Магазин', sendQuestion2));

async function sendQuestion2(ctx: TelegramContext) {
  await ctx.reply(`❓ 2/3: В какой нише работаете?`, { reply_markup: { inline_keyboard: [[{ text: '⚙️ Услуги', callback_data: 'q2_services' }], [{ text: '✏️ Другое', callback_data: 'q2_other' }]]}});
}
bot.action('q2_services', (ctx) => saveAnswerAndNext(ctx, 'niche', 'Услуги', sendQuestion3));
bot.action('q2_other', (ctx) => ctx.reply('✏️ Напишите вашу нишу текстом:'));

async function sendQuestion3(ctx: TelegramContext) {
  await ctx.reply(`❓ 3/3: Как с вами связаться?\n\n📛 Напишите ваше имя:`);
}

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
    
    // Обработка ввода имени на шаге 3
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
      
      // Обработка ввода имени на шаге 3
      if (session.current_step === 3) {
        if (!currentAnswers.contacts) {
          currentAnswers.contacts = { name: ctx.message.text };
          await prisma.quizSession.update({ data: { answers: currentAnswers }, where: { id: session.id } });
          await ctx.reply(
            '📱 Поделитесь вашим контактом для связи:',
            {
              reply_markup: {
                keyboard: [
                  [{ text: '📞 Поделиться контактом', request_contact: true }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
              }
            }
          );
        }
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
        // Получаем номер телефона из контакта
        currentAnswers.contacts.phone = ctx.message.contact.phone_number;
        
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
        
        console.log('Квиз завершен, заявка создана');
        console.log('>>> Пытаемся вызвать notifyChannelNewApplication');
        try {
          await notifyChannelNewApplication(application);
          console.log('>>> Функция notifyChannelNewApplication завершена');
        } catch (error) {
          console.error('>>> ОШИБКА В notifyChannelNewApplication:', error);
        }
        
        await ctx.reply(
          `🎉 Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.`,
          {
            reply_markup: { remove_keyboard: true } // Убираем клавиатуру
          }
        );
      }
    } catch (error) {
      console.error('Ошибка при обработке контакта:', error);
    }
  });
  
  // Обработка отказа от согласия
  bot.action('consent_decline', async (ctx) => {
    await ctx.reply(
      `❌ Без согласия на обработку персональных данных мы не можем предоставить услуги.\n\n` +
      `Если передумаете - нажмите /start`
    );
  });
  
  // Команда удаления персональных данных
  bot.command('delete_data', async (ctx) => {
    try {
      const userId = ctx.from.id;
      
      // Удаляем все данные пользователя
      await prisma.quizSession.deleteMany({ where: { user: { telegram_id: userId } } });
      await prisma.application.deleteMany({ where: { user: { telegram_id: userId } } });
      await prisma.user.delete({ where: { telegram_id: userId } });
      
      await ctx.reply(
        `✅ Ваши персональные данные удалены из нашей системы.\n\n` +
        `Если захотите воспользоваться услугами снова - нажмите /start`
      );
      
      console.log(`Удалены данные пользователя: ${userId}`);
    } catch (error) {
      console.error('Ошибка удаления данных:', error);
      await ctx.reply('❌ Ошибка при удалении данных. Обратитесь к администратору.');
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
      // Получаем номер телефона из контакта
      currentAnswers.contacts.phone = ctx.message.contact.phone_number;
      
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
      
      console.log('Квиз завершен, заявка создана');
      console.log('>>> Пытаемся вызвать notifyChannelNewApplication');
      try {
        await notifyChannelNewApplication(application);
        console.log('>>> Функция notifyChannelNewApplication завершена');
      } catch (error) {
        console.error('>>> ОШИБКА В notifyChannelNewApplication:', error);
      }
      
      await ctx.reply(
        `🎉 Спасибо! Ваша заявка принята. Мы скоро свяжемся с вами.`,
        {
          reply_markup: { remove_keyboard: true } // Убираем клавиатуру
        }
      );
    }
  } catch (error) {
    console.error('Ошибка при обработке контакта:', error);
  }
});

// Обработка отказа от согласия
bot.action('consent_decline', async (ctx) => {
  await ctx.reply(
    `❌ Без согласия на обработку персональных данных мы не можем предоставить услуги.\n\n` +
    `Если передумаете - нажмите /start`
  );
});

// Команда удаления персональных данных
bot.command('delete_data', async (ctx) => {
  try {
    const userId = ctx.from.id;
    
    // Удаляем все данные пользователя
    await prisma.quizSession.deleteMany({ where: { user: { telegram_id: userId } } });
    await prisma.application.deleteMany({ where: { user: { telegram_id: userId } } });
    await prisma.user.delete({ where: { telegram_id: userId } });
    
    await ctx.reply(
      `✅ Ваши персональные данные удалены из нашей системы.\n\n` +
      `Если захотите воспользоваться услугами снова - нажмите /start`
    );
    
    console.log(`Удалены данные пользователя: ${userId}`);
  } catch (error) {
    console.error('Ошибка удаления данных:', error);
    await ctx.reply('❌ Ошибка при удалении данных. Обратитесь к администратору.');
  }
});

// --- Функция для отправки уведомления в канал ---
async function notifyChannelNewApplication(application: any) {
    try {
      console.log('=== НАЧАЛО ОТПРАВКИ В КАНАЛ ===');
      console.log('CHANNEL_ID:', process.env.CHANNEL_ID);
      console.log('Данные заявки:', application);
      
      const { user, answers } = application;
      const contact = answers.contacts || {};
      const message = 
        `🔔 НОВАЯ ЗАЯВКА!\n\n` +
        `👤 Клиент: ${user.first_name || 'Аноним'} (@${user.username || '?'})\n` +
        `📞 Контакты: ${contact.name}, ${contact.phone}\n` +
        `\n--- Ответы на квиз ---\n`+
        `Тип сайта: ${answers.site_type || '?'}\n` +
        `Ниша: ${answers.niche || '?'}`;
      
      console.log('Сообщение для отправки:', message);
      
      if (CHANNEL_ID) {
          console.log('Отправляем в канал...');
          const result = await bot.telegram.sendMessage(CHANNEL_ID, message);
          console.log('✅ Сообщение отправлено!', result);
      } else {
          console.error('❌ CHANNEL_ID пустой!');
      }
    } catch (error) { 
      console.error('❌ ОШИБКА отправки в канал:', error); 
    }
  }

// --- ЗАПУСК БОТА ---
bot.launch();
console.log('✅ Бот успешно запущен!');
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));