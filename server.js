import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';
import { appendToSheet } from './googleSheets.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('🚀 Iniciando Servidor de Chatbots...');
console.log('📋 Variables de entorno:');
console.log('  - TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Configurado' : '❌ NO configurado');
console.log('  - TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Configurado' : '❌ NO configurado');
console.log('  - TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER ? '✅ Configurado' : '❌ NO configurado');
console.log('  - TELEGRAM_TOKEN:', process.env.TELEGRAM_TOKEN ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✅ Configurado' : '❌ NO configurado');

// Estado de conversaciones (en memoria)
const userStates = new Map();

// Función para enviar mensaje de WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: to,
      body: message
    });
    console.log(`📤 Mensaje enviado a ${to}: ${message.substring(0, 50)}...`);
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error.message);
  }
}

// Función para procesar mensajes de WhatsApp
async function processWhatsAppMessage(from, body) {
  console.log(`📩 Mensaje recibido de ${from}: ${body}`);
  
  const userState = userStates.get(from) || { step: 'welcome' };
  
  switch (userState.step) {
    case 'welcome':
      await sendWhatsAppMessage(from, 
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
      userStates.set(from, { step: 'service', data: {} });
      break;
      
    case 'service':
      const services = {
        '1': 'Reparación de hardware',
        '2': 'Reparación de software',
        '3': 'Mantenimiento preventivo',
        '4': 'Instalación de programas',
        '5': 'Otro'
      };
      
      if (services[body]) {
        userState.data.service = services[body];
        await sendWhatsAppMessage(from,
          `Perfecto, has seleccionado: *${services[body]}*\n\n` +
          '¿Qué tipo de equipo es?\n\n' +
          '1️⃣ Laptop\n' +
          '2️⃣ PC de escritorio\n' +
          '3️⃣ All-in-one\n' +
          '4️⃣ Otro\n\n' +
          'Responde con el número.'
        );
        userState.step = 'device';
        userStates.set(from, userState);
      } else {
        await sendWhatsAppMessage(from, 
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
      
      if (devices[body]) {
        userState.data.device = devices[body];
        await sendWhatsAppMessage(from,
          `Entendido, es un *${devices[body]}*\n\n` +
          'Por favor, describe brevemente el problema que tiene tu equipo:'
        );
        userState.step = 'problem';
        userStates.set(from, userState);
      } else {
        await sendWhatsAppMessage(from,
          '❌ Opción no válida. Por favor responde con un número del 1 al 4.'
        );
      }
      break;
      
    case 'problem':
      userState.data.problem = body;
      await sendWhatsAppMessage(from,
        `Gracias por la información. Problema registrado: "${body}"\n\n` +
        'Por favor, indícame tu nombre completo:'
      );
      userState.step = 'name';
      userStates.set(from, userState);
      break;
      
    case 'name':
      userState.data.name = body;
      await sendWhatsAppMessage(from,
        `Perfecto, ${body}! 👍\n\n` +
        'Ahora necesito que me indiques cuándo te gustaría agendar la cita.\n\n' +
        'Por favor usa el formato: *DD/MM HH:MM*\n' +
        'Ejemplo: 15/01 10:30\n\n' +
        '⏰ Horarios disponibles:\n' +
        '• Lunes a Viernes: 9:00 AM - 5:00 PM\n' +
        '• Sábados: 9:00 AM - 12:00 PM\n' +
        '• Domingos: Cerrado'
      );
      userState.step = 'schedule';
      userStates.set(from, userState);
      break;
      
    case 'schedule':
      // Validar formato de fecha/hora
      const dateTimeRegex = /^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/;
      const match = body.match(dateTimeRegex);
      
      if (match) {
        const [, day, month, hour, minute] = match;
        const now = new Date();
        const year = now.getFullYear();
        const appointmentDate = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        
        userState.data.timeISO = appointmentDate.toISOString();
        userState.data.timeFormatted = body;
        
        // Guardar en Google Sheets
        try {
          await appendToSheet({
            Timestamp: new Date().toISOString(),
            Nombre: userState.data.name,
            Telefono_ID: from,
            Servicio: userState.data.service,
            Equipo: userState.data.device,
            Problema: userState.data.problem,
            Horario: userState.data.timeISO,
            Estado: 'Pendiente'
          });
          
          await sendWhatsAppMessage(from,
            '✅ *¡Cita agendada exitosamente!*\n\n' +
            '📋 *Resumen de tu cita:*\n' +
            `👤 Nombre: ${userState.data.name}\n` +
            `🔧 Servicio: ${userState.data.service}\n` +
            `💻 Equipo: ${userState.data.device}\n` +
            `📝 Problema: ${userState.data.problem}\n` +
            `📅 Fecha y hora: ${body}\n\n` +
            '📞 Te contactaremos pronto para confirmar tu cita.\n\n' +
            '¿Necesitas agendar otra cita? Envía *"hola"* para comenzar de nuevo.'
          );
          
          console.log(`✅ Cita guardada en Google Sheets para ${from}`);
        } catch (error) {
          console.error('❌ Error al guardar en Google Sheets:', error);
          await sendWhatsAppMessage(from,
            '⚠️ Hubo un problema al guardar tu cita. Por favor contacta directamente con nosotros.'
          );
        }
        
        // Reiniciar estado
        userStates.set(from, { step: 'welcome', data: {} });
      } else {
        await sendWhatsAppMessage(from,
          '❌ Formato de fecha/hora no válido.\n\n' +
          'Por favor usa el formato: *DD/MM HH:MM*\n' +
          'Ejemplo: 15/01 10:30'
        );
      }
      break;
      
    default:
      userStates.set(from, { step: 'welcome', data: {} });
      await processWhatsAppMessage(from, body);
  }
}

// Webhook para WhatsApp (Twilio)
app.post('/whatsapp', async (req, res) => {
  const { From, Body } = req.body;
  
  console.log(`📱 Webhook recibido de ${From}: ${Body}`);
  
  // Procesar mensaje
  await processWhatsAppMessage(From, Body);
  
  // Responder a Twilio (vacío porque ya enviamos la respuesta con la API)
  res.status(200).send('');
});

// Iniciar bot de Telegram (API Nativa)
import('./telegram_bot.js').then(() => {
  console.log('✅ Bot de Telegram iniciado y escuchando mensajes');
}).catch(error => {
  console.error('❌ Error al iniciar bot de Telegram:', error);
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chatbot Server Running',
    whatsapp: 'Twilio API',
    telegram: 'BuilderBot',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor iniciado en puerto ${PORT}`);
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/whatsapp`);
  console.log(`💬 Telegram: Ejecutándose en paralelo`);
  console.log(`\n✅ Todo listo para recibir mensajes!\n`);
});
