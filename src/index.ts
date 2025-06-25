// src/index.ts

// --- Импорты ---
// Telegraf - основа бота
import { Telegraf } from 'telegraf';
// dotenv - для чтения секретов из .env файла
import dotenv from 'dotenv';
// PrismaClient - наш "мост" для общения с базой данных
import { PrismaClient } from '@prisma/client';


// --- Инициализация ---
// Загружаем переменные из .env
dotenv.config();
// Создаем экземпляр PrismaClient. Через него будем делать все запросы к БД.
const prisma = new PrismaClient();
// Получаем токен бота
const botToken = process.env.BOT_TOKEN;

// Проверка токена (оставляем нашу полезную диагностику)
if (!botToken) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN не найден!");
  process.exit(1);
}

// Создаем экземпляр бота
const bot = new Telegraf(botToken);


// --- Логика Бота ---

// Команда /start. Теперь она стала сложнее и умнее.
// async/await - это способ работать с операциями, которые занимают время (например, запрос к БД)
bot.start(async (ctx) => {
  try {
    console.log('Получена команда /start от пользователя:', ctx.from);

    // Берем информацию о пользователе из контекста сообщения
    const telegramUser = ctx.from;

    // ИСПОЛЬЗУЕМ PRISMA!
    // upsert - это волшебная команда: "обнови, если существует, или создай, если не существует".
    // Она идеально подходит для нашей задачи.
    const userInDb = await prisma.user.upsert({
      // Ищем пользователя по его уникальному telegram_id
      where: { telegram_id: telegramUser.id },
      // Если нашли - обновляем данные (на случай, если пользователь сменил username)
      update: {
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      },
      // Если не нашли - создаем новую запись
      create: {
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language_code: telegramUser.language_code,
      },
    });

    console.log('Пользователь успешно сохранен/обновлен в БД:', userInDb);

    // Отвечаем пользователю, но уже по имени!
    ctx.reply(`Привет, ${userInDb.first_name}! Рад знакомству.`);

  } catch (error) {
    console.error('Произошла ошибка при обработке /start:', error);
    ctx.reply('Ой, что-то пошло не так. Попробуйте еще раз позже.');
  }
});


// --- Запуск и остановка ---
bot.launch();
console.log('✅ Бот успешно запущен и подключен к БД!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));