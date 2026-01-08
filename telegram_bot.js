import TelegramBot from 'node-telegram-bot-api';
import { appendToSheet } from './googleSheets.js';

console.log('🚀 Iniciando Bot de Telegram (API Nativa)...');
console.log('📋 Variables de entorno:');
console.log('  - TELEGRAM_TOKEN:', process.env.TELEGRAM_TOKEN ? '✅ Configurado' : '❌ NO configurado');

// Crear bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Estado de conversaciones (en memoria)
const userStates = new Map();

console.log('✅ Bot de Telegram iniciado correctamente');
console.log('📨 Esperando mensajes...');

// Función para enviar mensaje
async function sendMessage(chatId, text, options = {}) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
    console.log(`📤 Mensaje enviado a ${chatId}: ${text.substring(0, 50)}...`);
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error.message);
  }
}

// Función para procesar mensajes
async function processMessage(chatId, text, username) {
  console.log(`📩 Mensaje recibido de @${username} (${chatId}): ${text}`);
  
  const userState = userStates.get(chatId) || { step: 'welcome' };
  
  switch (userState.step) {
    case 'welcome':
      await sendMessage(chatId,
        '¡Bienvenido al Servicio Técnico MyF! 👋\n\n' +
        'Soy tu asistente virtual para agendar reparaciones de computadores.\n\n' +
        'Por favor, cuéntame:\n' +
        '¿Qué tipo de servicio necesitas?\n\n' +
        '1️⃣ Reparación de hardware\n' +
        '2️⃣ Reparación de software\n' +
        '3️⃣ Mantenimiento preventivo\n' +
        '4️⃣ Instalación de programas\n' +
        '5️⃣ Otro\n\n' +
        'Responde con el número de tu opción.'
      );
      userStates.set(chatId, { step: 'service', data: {} });
      break;
      
    case 'service':
      const services = {
        '1': 'Reparación de hardware',
        '2': 'Reparación de software',
        '3': 'Mantenimiento preventivo',
        '4': 'Instalación de programas',
        '5': 'Otro'
      };
      
      if (services[text]) {
        userState.data.service = services[text];
        await sendMessage(chatId,
          `Perfecto, has seleccionado: *${services[text]}*\n\n` +
          '¿Qué tipo de equipo es?\n\n' +
          '1️⃣ Laptop\n' +
          '2️⃣ PC de escritorio\n' +
          '3️⃣ All-in-one\n' +
          '4️⃣ Otro\n\n' +
          'Responde con el número.'
        );
        userState.step = 'device';
        userStates.set(chatId, userState);
      } else {
        await sendMessage(chatId,
          '❌ Opción no válida. Por favor responde con un número del 1 al 5.'
        );
      }
      break;
      
    case 'device':
      const devices = {
        '1': 'Laptop',
        '2': 'PC de escritorio',
        '3': 'All-in-one',
        '4': 'Otro'
      };
      
      if (devices[text]) {
        userState.data.device = devices[text];
        await sendMessage(chatId,
          `Entendido, es un *${devices[text]}*\n\n` +
          'Por favor, describe brevemente el problema que tiene tu equipo:'
        );
        userState.step = 'problem';
        userStates.set(chatId, userState);
      } else {
        await sendMessage(chatId,
          '❌ Opción no válida. Por favor responde con un número del 1 al 4.'
        );
      }
      break;
      
    case 'problem':
      userState.data.problem = text;
      await sendMessage(chatId,
        `Gracias por la información. Problema registrado: "${text}"\n\n` +
        'Por favor, indícame tu nombre completo:'
      );
      userState.step = 'name';
      userStates.set(chatId, userState);
      break;
      
    case 'name':
      userState.data.name = text;
      await sendMessage(chatId,
        `Perfecto, ${text}! 👍\n\n` +
        'Ahora necesito que me indiques cuándo te gustaría agendar la cita.\n\n' +
        'Por favor usa el formato: *DD/MM HH:MM*\n' +
        'Ejemplo: 15/01 10:30\n\n' +
        '⏰ Horarios disponibles:\n' +
        '• Lunes a Viernes: 9:00 AM - 5:00 PM\n' +
        '• Sábados: 9:00 AM - 12:00 PM\n' +
        '• Domingos: Cerrado'
      );
      userState.step = 'schedule';
      userStates.set(chatId, userState);
      break;
      
    case 'schedule':
      // Validar formato de fecha/hora
      const dateTimeRegex = /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;
      const match = text.match(dateTimeRegex);
      
      if (match) {
        const [, day, month, hour, minute] = match;
        const now = new Date();
        const year = now.getFullYear();
        const appointmentDate = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        
        userState.data.timeISO = appointmentDate.toISOString();
        userState.data.timeFormatted = text;
        
        // Guardar en Google Sheets
        try {
          await appendToSheet({
            Timestamp: new Date().toISOString(),
            Nombre: userState.data.name,
            Telefono_ID: `telegram:${chatId}`,
            Username: username || 'N/A',
            Servicio: userState.data.service,
            Equipo: userState.data.device,
            Problema: userState.data.problem,
            Horario: userState.data.timeISO,
            Estado: 'Pendiente'
          });
          
          await sendMessage(chatId,
            '✅ *¡Cita agendada exitosamente!*\n\n' +
            '📋 *Resumen de tu cita:*\n' +
            `👤 Nombre: ${userState.data.name}\n` +
            `🔧 Servicio: ${userState.data.service}\n` +
            `💻 Equipo: ${userState.data.device}\n` +
            `📝 Problema: ${userState.data.problem}\n` +
            `📅 Fecha y hora: ${text}\n\n` +
            '📞 Te contactaremos pronto para confirmar tu cita.\n\n' +
            '¿Necesitas agendar otra cita? Envía */start* o *hola* para comenzar de nuevo.'
          );
          
          console.log(`✅ Cita guardada en Google Sheets para usuario ${chatId}`);
        } catch (error) {
          console.error('❌ Error al guardar en Google Sheets:', error);
          await sendMessage(chatId,
            '⚠️ Hubo un problema al guardar tu cita. Por favor contacta directamente con nosotros.'
          );
        }
        
        // Reiniciar estado
        userStates.set(chatId, { step: 'welcome', data: {} });
      } else {
        await sendMessage(chatId,
          '❌ Formato de fecha/hora no válido.\n\n' +
          'Por favor usa el formato: *DD/MM HH:MM*\n' +
          'Ejemplo: 15/01 10:30'
        );
      }
      break;
      
    default:
      userStates.set(chatId, { step: 'welcome', data: {} });
      await processMessage(chatId, text, username);
  }
}

// Escuchar comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;
  console.log(`📩 Comando /start recibido de @${username} (${chatId})`);
  userStates.set(chatId, { step: 'welcome', data: {} });
  await processMessage(chatId, '/start', username);
});

// Escuchar palabra "hola"
bot.onText(/^(hola|inicio|hi|hello)$/i, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || msg.from.first_name;
  console.log(`📩 Saludo recibido de @${username} (${chatId})`);
  userStates.set(chatId, { step: 'welcome', data: {} });
  await processMessage(chatId, 'hola', username);
});

// Escuchar todos los mensajes
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const username = msg.from.username || msg.from.first_name;
  
  // Ignorar comandos y saludos (ya se manejan arriba)
  if (text.startsWith('/') || /^(hola|inicio|hi|hello)$/i.test(text)) {
    return;
  }
  
  await processMessage(chatId, text, username);
});

// Manejo de errores
bot.on('polling_error', (error) => {
  console.error('❌ Error de polling:', error.message);
});

export default bot;
