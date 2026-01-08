import 'dotenv/config';
import { createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot';
import { TelegramProvider } from '@builderbot-plugins/telegram';
import { appendToSheet } from './googleSheets.js';

console.log('🚀 Iniciando Bot de Telegram...');
console.log('📋 Variables de entorno cargadas:');
console.log('  - TELEGRAM_TOKEN:', process.env.TELEGRAM_TOKEN ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✅ Configurado' : '❌ NO configurado');

console.log('🔧 Configurando flujos del bot...');

// Flujo de bienvenida
const welcomeFlow = addKeyword(['hola', 'inicio', 'start', '/start'])
  .addAnswer(
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

// Flujo de selección de servicio
const serviceFlow = addKeyword(['1', '2', '3', '4', '5'])
  .addAnswer(
    'Perfecto! Ahora dime:\n' +
    '¿Qué tipo de equipo es?\n\n' +
    '1️⃣ Laptop\n' +
    '2️⃣ PC de escritorio\n' +
    '3️⃣ All-in-one\n' +
    '4️⃣ Otro\n\n' +
    'Responde con el número.',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const services = {
        '1': 'Reparación de hardware',
        '2': 'Reparación de software',
        '3': 'Mantenimiento preventivo',
        '4': 'Instalación de programas',
        '5': 'Otro'
      };
      await state.update({ service: services[ctx.body] });
    }
  );

// Flujo de descripción del problema
const problemFlow = addKeyword([''])
  .addAnswer(
    'Por favor, describe brevemente el problema que tiene tu equipo:',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const devices = {
        '1': 'Laptop',
        '2': 'PC de escritorio',
        '3': 'All-in-one',
        '4': 'Otro'
      };
      await state.update({ device: devices[ctx.body] });
    }
  );

// Flujo de nombre
const nameFlow = addKeyword([''])
  .addAnswer(
    'Gracias por la información.\n\n' +
    'Por favor, indícame tu nombre completo:',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      await state.update({ problem: ctx.body });
    }
  );

// Flujo de agendamiento
const schedulingFlow = addKeyword([''])
  .addAnswer(
    'Perfecto! 👍\n\n' +
    'Ahora necesito que me indiques cuándo te gustaría agendar la cita.\n\n' +
    'Por favor usa el formato: *DD/MM HH:MM*\n' +
    'Ejemplo: 15/01 10:30\n\n' +
    '⏰ Horarios disponibles:\n' +
    '• Lunes a Viernes: 9:00 AM - 5:00 PM\n' +
    '• Sábados: 9:00 AM - 12:00 PM\n' +
    '• Domingos: Cerrado',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      await state.update({ name: ctx.body });
    }
  );

// Flujo de confirmación
const confirmationFlow = addKeyword([''])
  .addAnswer(
    'Procesando tu cita...',
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const userState = state.getMyState();
      
      // Validar formato de fecha/hora
      const dateTimeRegex = /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;
      const match = ctx.body.match(dateTimeRegex);
      
      if (match) {
        const [, day, month, hour, minute] = match;
        const now = new Date();
        const year = now.getFullYear();
        const appointmentDate = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        
        try {
          await appendToSheet({
            Timestamp: new Date().toISOString(),
            Nombre: userState.name,
            Telefono_ID: ctx.from,
            Servicio: userState.service,
            Equipo: userState.device,
            Problema: userState.problem,
            Horario: appointmentDate.toISOString(),
            Estado: 'Pendiente'
          });
          
          await flowDynamic(
            '✅ *¡Cita agendada exitosamente!*\n\n' +
            '📋 *Resumen de tu cita:*\n' +
            `👤 Nombre: ${userState.name}\n` +
            `🔧 Servicio: ${userState.service}\n` +
            `💻 Equipo: ${userState.device}\n` +
            `📝 Problema: ${userState.problem}\n` +
            `📅 Fecha y hora: ${ctx.body}\n\n` +
            '📞 Te contactaremos pronto para confirmar tu cita.\n\n' +
            '¿Necesitas agendar otra cita? Envía *"hola"* para comenzar de nuevo.'
          );
          
          console.log(`✅ Cita guardada en Google Sheets para usuario ${ctx.from}`);
        } catch (error) {
          console.error('❌ Error al guardar en Google Sheets:', error);
          await flowDynamic(
            '⚠️ Hubo un problema al guardar tu cita. Por favor contacta directamente con nosotros.'
          );
        }
        
        // Limpiar estado
        await state.clear();
      } else {
        await flowDynamic(
          '❌ Formato de fecha/hora no válido.\n\n' +
          'Por favor usa el formato: *DD/MM HH:MM*\n' +
          'Ejemplo: 15/01 10:30'
        );
      }
    }
  );

console.log('📡 Configurando proveedor de Telegram...');
console.log('🔑 Token (primeros 10 caracteres):', process.env.TELEGRAM_TOKEN ? process.env.TELEGRAM_TOKEN.substring(0, 10) + '...' : 'NO CONFIGURADO');

const adapterProvider = createProvider(TelegramProvider, {
  token: process.env.TELEGRAM_TOKEN
});

console.log('💾 Configurando base de datos...');
const adapterDB = null; // Sin base de datos persistente

console.log('🤖 Creando bot...');
const bot = await createBot({
  flow: createFlow([welcomeFlow, serviceFlow, problemFlow, nameFlow, schedulingFlow, confirmationFlow]),
  provider: adapterProvider,
  database: adapterDB
});

console.log('✅ Bot de Telegram iniciado correctamente');
console.log('📨 El bot está listo para recibir mensajes en Telegram');

export default bot;
