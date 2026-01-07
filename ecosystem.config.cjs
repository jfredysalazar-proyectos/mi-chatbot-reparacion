module.exports = {
  apps: [
    {
      name: 'whatsapp-repair-bot',
      script: './app.js',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/whatsapp-error.log',
      out_file: './logs/whatsapp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'telegram-repair-bot',
      script: './telegram_app.js',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/telegram-error.log',
      out_file: './logs/telegram-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
