// ecosystem.config.js
module.exports = {
    apps: [{
      name: 'telegram-bot',
      script: 'dist/bot.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      
      // Настройки для автоматического перезапуска при ошибках
      exp_backoff_restart_delay: 100,
      
      // Переменные окружения
      env_production: {
        NODE_ENV: 'production',
        TZ: 'Europe/Moscow'
      }
    }]
  }