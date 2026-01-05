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
    },
    {
      name: 'telegram-repair-bot',
      script: './telegram_app.js',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
