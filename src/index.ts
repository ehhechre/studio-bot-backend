// src/index.ts

// --- Импорты ---
import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';

// --- Типы для квиза ---
interface QuizAnswers {
  step1_site_type?: string;
  step2_niche?: string;
  step3_branding?: string;
  step4_tasks?: string[];
  step5_pages?: string[];
  step6_contacts?: {
    name?: string;
    phone?: string;
    email?: string;
    comment?: string;
  };
}

interface TelegramContext extends Context {
  from: NonNullable<Context['from']>;
}

// --- Инициализация ---
dotenv.config();
const prisma = new PrismaClient();
const botToken = process.env.BOT_TOKEN;

if (!botToken) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN не найден!");
  process.exit(1);
}

const bot = new Telegraf(botToken);

// --- СТАРТОВОЕ МЕНЮ ---
bot.start(async (ctx: TelegramContext) => {
  try {
    console.log('Получена команда /start от пользователя:', ctx.from);
    
    const telegramUser = ctx.from;
    
    // Сохраняем/обновляем пользователя
    const userInDb = await prisma.user.upsert({
      where: { telegram_id: telegramUser.id },
      update: {
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      },
      create: {
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language_code: telegramUser.language_code,
      },
    });

    console.log('Пользователь сохранен в БД:', userInDb);

    // Стартовое меню
    await ctx.reply(
      `Привет, ${userInDb.first_name}! 🚀\n\n` +
      `Я помогу рассчитать стоимость сайта для вашего бизнеса.\n\n` +
      `Выберите действие:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' },
              { text: '👁 Посмотреть работы', callback_data: 'view_portfolio' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Ошибка в /start:', error);
    ctx.reply('Ой, что-то пошло не так. Попробуйте еще раз позже.');
  }
});

// --- ПОРТФОЛИО ---
bot.action('view_portfolio', async (ctx: TelegramContext) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply(
      `📱 Наше портфолио: https://ваш-сайт.ru\n` +
      `🔥 Более 100 успешных проектов\n\n` +
      `Готовы обсудить ваш проект?`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' }],
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Ошибка в портфолио:', error);
  }
});

// --- ГЛАВНОЕ МЕНЮ ---
bot.action('main_menu', async (ctx: TelegramContext) => {
  try {
    await ctx.answerCbQuery();
    const user = await prisma.user.findUnique({
      where: { telegram_id: ctx.from.id }
    });
    
    await ctx.reply(
      `Привет, ${user?.first_name}! 🚀\n\n` +
      `Выберите действие:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Рассчитать стоимость', callback_data: 'start_quiz' },
              { text: '👁 Посмотреть работы', callback_data: 'view_portfolio' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Ошибка в главном меню:', error);
  }
});

// --- СОГЛАСИЕ НА ОБРАБОТКУ ДАННЫХ ---
bot.action('start_quiz', async (ctx: TelegramContext) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply(
      `📋 Для расчета стоимости нужно ответить на несколько вопросов.\n\n` +
      `⚖️ Даю согласие на обработку персональных данных согласно политике конфиденциальности.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Согласен', callback_data: 'consent_agree' },
              { text: '❌ Не согласен', callback_data: 'consent_decline' }
            ]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Ошибка в согласии:', error);
  }
});

// --- ОТКАЗ ОТ СОГЛАСИЯ ---
bot.action('consent_decline', async (ctx: TelegramContext) => {
  try {
    await ctx.answerCbQuery();
    await ctx.reply(
      `😔 Без согласия на обработку данных мы не можем продолжить.\n\n` +
      `Если передумаете - всегда можете вернуться!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
          ]
        }
      }
    );
  } catch (error) {
    console.error('Ошибка в отказе:', error);
  }
});

// --- НАЧАЛО КВИЗА ---
bot.action('consent_agree', async (ctx: TelegramContext) => {
  try {
    await ctx.answerCbQuery();
    
    // Создаем новую сессию квиза
    const user = await prisma.user.findUnique({
      where: { telegram_id: ctx.from.id }
    });
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const quizSession = await prisma.quizSession.create({
      data: {
        user_id: user.id,
        current_step: 1,
        answers: {} as Prisma.JsonObject,
        started_at: new Date(),
        quiz_type: 'website_brief'
      }
    });

    console.log('Создана новая сессия квиза:', quizSession.id);
    
    // Начинаем с первого вопроса
    await sendQuestion1(ctx);
    
  } catch (error) {
    console.error('Ошибка при создании сессии квиза:', error);
    await ctx.reply('Произошла ошибка. Попробуйте еще раз.');
  }
});

// --- ВОПРОС 1: ТИП САЙТА ---
async function sendQuestion1(ctx: TelegramContext): Promise<void> {
  await ctx.reply(
    `❓ Вопрос 1 из 6\n\n` +
    `Какой сайт вам нужен?`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📄 Лендинг', callback_data: 'q1_landing' }],
          [{ text: '📚 Многостраничный сайт', callback_data: 'q1_multipage' }],
          [{ text: '🛒 Интернет-магазин', callback_data: 'q1_shop' }],
          [{ text: '❓ Не знаю — нужна консультация', callback_data: 'q1_consultation' }]
        ]
      }
    }
  );
}

// Обработчики ответов на вопрос 1
bot.action('q1_landing', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step1_site_type', 'Лендинг', sendQuestion2);
});

bot.action('q1_multipage', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step1_site_type', 'Многостраничный сайт', sendQuestion2);
});

bot.action('q1_shop', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step1_site_type', 'Интернет-магазин', sendQuestion2);
});

bot.action('q1_consultation', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step1_site_type', 'Не знаю — нужна консультация', sendQuestion2);
});

// --- ВОПРОС 2: НИША ---
async function sendQuestion2(ctx: TelegramContext): Promise<void> {
  await ctx.reply(
    `❓ Вопрос 2 из 6\n\n` +
    `В какой нише вы работаете?`,
    {
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
    }
  );
}

bot.action('q2_services', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step2_niche', 'Услуги', sendQuestion3);
});

bot.action('q2_education', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step2_niche', 'Образование', sendQuestion3);
});

bot.action('q2_construction', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step2_niche', 'Строительство', sendQuestion3);
});

bot.action('q2_beauty', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step2_niche', 'Красота/мода', sendQuestion3);
});

bot.action('q2_realestate', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step2_niche', 'Недвижимость', sendQuestion3);
});

bot.action('q2_other', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await ctx.reply('✏️ Напишите вашу нишу текстом:');
  // Текстовый ответ обрабатывается в bot.on('text')
});

// --- ВОПРОС 3: ФИРМЕННЫЙ СТИЛЬ ---
async function sendQuestion3(ctx: TelegramContext): Promise<void> {
  await ctx.reply(
    `❓ Вопрос 3 из 6\n\n` +
    `Есть ли у вас фирменный стиль или логотип?`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Да, всё готово', callback_data: 'q3_ready' }],
          [{ text: '🔄 Частично', callback_data: 'q3_partial' }],
          [{ text: '🆕 Нет, нужно создать с нуля', callback_data: 'q3_new' }]
        ]
      }
    }
  );
}

bot.action('q3_ready', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step3_branding', 'Да, всё готово', sendQuestion4);
});

bot.action('q3_partial', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step3_branding', 'Частично', sendQuestion4);
});

bot.action('q3_new', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step3_branding', 'Нет, нужно создать с нуля', sendQuestion4);
});

// --- ВОПРОС 4: ЗАДАЧИ САЙТА ---
async function sendQuestion4(ctx: TelegramContext): Promise<void> {
  await ctx.reply(
    `❓ Вопрос 4 из 6\n\n` +
    `Какие задачи должен решать сайт? (выберите основную)`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👥 Привлекать клиентов', callback_data: 'q4_clients' }],
          [{ text: '💰 Продавать онлайн', callback_data: 'q4_sales' }],
          [{ text: '🏢 Укреплять бренд', callback_data: 'q4_brand' }],
          [{ text: '📖 Рассказывать о компании', callback_data: 'q4_about' }]
        ]
      }
    }
  );
}

bot.action('q4_clients', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step4_tasks', ['Привлекать клиентов'], sendQuestion5);
});

bot.action('q4_sales', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step4_tasks', ['Продавать онлайн'], sendQuestion5);
});

bot.action('q4_brand', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step4_tasks', ['Укреплять бренд'], sendQuestion5);
});

bot.action('q4_about', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step4_tasks', ['Рассказывать о компании'], sendQuestion5);
});

// --- ВОПРОС 5: СТРАНИЦЫ ---
async function sendQuestion5(ctx: TelegramContext): Promise<void> {
  await ctx.reply(
    `❓ Вопрос 5 из 6\n\n` +
    `Какие страницы вам точно понадобятся? (выберите основные)`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Главная + О компании', callback_data: 'q5_basic' }],
          [{ text: '⚙️ + Услуги', callback_data: 'q5_services' }],
          [{ text: '💼 + Кейсы/Портфолио', callback_data: 'q5_cases' }],
          [{ text: '📞 + Контакты', callback_data: 'q5_contacts' }]
        ]
      }
    }
  );
}

bot.action('q5_basic', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step5_pages', ['Главная', 'О компании'], sendQuestion6);
});

bot.action('q5_services', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step5_pages', ['Главная', 'О компании', 'Услуги'], sendQuestion6);
});

bot.action('q5_cases', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step5_pages', ['Главная', 'О компании', 'Услуги', 'Кейсы'], sendQuestion6);
});

bot.action('q5_contacts', async (ctx: TelegramContext) => {
  await ctx.answerCbQuery();
  await saveAnswerAndNext(ctx, 'step5_pages', ['Главная', 'О компании', 'Услуги', 'Контакты'], sendQuestion6);
});

// --- ВОПРОС 6: КОНТАКТЫ ---
async function sendQuestion6(ctx: TelegramContext): Promise<void> {
  await ctx.reply(
    `❓ Вопрос 6 из 6\n\n` +
    `Как с вами связаться?\n\n` +
    `📛 Напишите ваше имя:`
  );
}

// --- УНИВЕРСАЛЬНАЯ ФУНКЦИЯ СОХРАНЕНИЯ ---
async function saveAnswerAndNext(
  ctx: TelegramContext, 
  field: keyof QuizAnswers, 
  value: any, 
  nextFunction: (ctx: TelegramContext) => Promise<void>
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { telegram_id: ctx.from.id }
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Находим активную сессию квиза
    const session = await prisma.quizSession.findFirst({
      where: {
        user_id: user.id,
        is_completed: false
      },
      orderBy: { created_at: 'desc' }
    });

    if (!session) {
      throw new Error('Активная сессия квиза не найдена');
    }

    // Обновляем ответы - безопасное приведение типов
    const currentAnswers = (session.answers as QuizAnswers) || {};
    const updatedAnswers: QuizAnswers = { ...currentAnswers, [field]: value };

    await prisma.quizSession.update({
      where: { id: session.id },
      data: {
        answers: updatedAnswers as Prisma.JsonObject,
        current_step: (session.current_step || 0) + 1,
        updated_at: new Date()
      }
    });

    console.log(`Сохранен ответ ${field}:`, value);

    // Переходим к следующему вопросу
    await nextFunction(ctx);

  } catch (error) {
    console.error('Ошибка при сохранении ответа:', error);
    await ctx.reply('Произошла ошибка. Попробуйте еще раз.');
  }
}

// --- ОБРАБОТКА ТЕКСТОВЫХ СООБЩЕНИЙ (ДЛЯ КОНТАКТОВ) ---
bot.on('text', async (ctx: TelegramContext) => {
  try {
    const user = await prisma.user.findUnique({
      where: { telegram_id: ctx.from.id }
    });

    if (!user) return;

    const session = await prisma.quizSession.findFirst({
      where: {
        user_id: user.id,
        is_completed: false
      },
      orderBy: { created_at: 'desc' }
    });

    if (!session || !ctx.message || !('text' in ctx.message)) return;

    const currentAnswers = (session.answers as QuizAnswers) || {};
    
    // Если мы на 6 шаге (контакты)
    if (session.current_step === 6) {
      if (!currentAnswers.step6_contacts) {
        // Первое сообщение - имя
        currentAnswers.step6_contacts = { name: ctx.message.text };
        
        await prisma.quizSession.update({
          where: { id: session.id },
          data: { answers: currentAnswers as Prisma.JsonObject }
        });
        
        await ctx.reply('📱 Теперь напишите ваш телефон:');
        
      } else if (!currentAnswers.step6_contacts.phone) {
        // Второе сообщение - телефон
        currentAnswers.step6_contacts.phone = ctx.message.text;
        
        await prisma.quizSession.update({
          where: { id: session.id },
          data: { answers: currentAnswers as Prisma.JsonObject }
        });
        
        await ctx.reply('📧 И ваш email:');
        
      } else if (!currentAnswers.step6_contacts.email) {
        // Третье сообщение - email
        currentAnswers.step6_contacts.email = ctx.message.text;
        
        await prisma.quizSession.update({
          where: { id: session.id },
          data: { answers: currentAnswers as Prisma.JsonObject }
        });
        
        await ctx.reply('✍️ Есть дополнительные комментарии? (или напишите "нет")');
        
      } else {
        // Четвертое сообщение - комментарий
        currentAnswers.step6_contacts.comment = ctx.message.text === 'нет' ? '' : ctx.message.text;
        
        // Завершаем квиз
        const completedAt = new Date();
        const startedAt = session.started_at || session.created_at || new Date();
        const completionTime = Math.round((completedAt.getTime() - startedAt.getTime()) / (1000 * 60));
        
        await prisma.quizSession.update({
          where: { id: session.id },
          data: {
            answers: currentAnswers as Prisma.JsonObject,
            is_completed: true,
            completed_at: completedAt,
            completion_time_minutes: completionTime,
            current_step: 7
          }
        });
        
        // Создаем заявку
        await prisma.application.create({
          data: {
            user_id: user.id,
            status: 'new',
            answers: currentAnswers as Prisma.JsonObject,
            contact_info: `${currentAnswers.step6_contacts.name}, ${currentAnswers.step6_contacts.phone}, ${currentAnswers.step6_contacts.email}`,
            source: 'telegram_bot'
          }
        });
        
        console.log('Квиз завершен, заявка создана');
        
        await ctx.reply(
          `🎉 Спасибо! Ваша заявка принята.\n\n` +
          `⏱ Время прохождения: ${completionTime} мин\n\n` +
          `📞 Мы свяжемся с вами в ближайшее время для обсуждения деталей.\n\n` +
          `Пока ждете, можете посмотреть наши работы:`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '👁 Посмотреть портфолио', callback_data: 'view_portfolio' }],
                [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
              ]
            }
          }
        );
      }
    }
    
    // Обработка "другое" для ниши
    if (session.current_step === 2 && !currentAnswers.step2_niche) {
      await saveAnswerAndNext(ctx, 'step2_niche', ctx.message.text, sendQuestion3);
    }
    
  } catch (error) {
    console.error('Ошибка при обработке текста:', error);
  }
});

// --- ЗАПУСК БОТА ---
bot.launch();
console.log('✅ Бот успешно запущен и подключен к БД!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
