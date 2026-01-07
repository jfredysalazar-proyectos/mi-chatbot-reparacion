import 'dotenv/config';
import { createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { appendToSheet } from './googleSheets.js';

console.log('🚀 Iniciando Bot de WhatsApp...');
console.log('📋 Variables de entorno cargadas:');
console.log('  - GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✅ Configurado' : '❌ NO configurado');

// Contador global de mensajes
let messageCount = 0;
let qrGenerated = false;
let connected = false;

const welcomeFlow = addKeyword(['hola', 'hi', 'hello', 'buenos días', 'buenas tardes'])
    .addAnswer('¡Bienvenido al Servicio Técnico MyF! 👋', null, async (ctx) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Mensaje recibido en welcomeFlow de usuario ${ctx.from}: ${ctx.body}`);
    })
    .addAnswer([
        'Selecciona una opción:',
        '1️⃣ Agendar cita',
        '2️⃣ Ver servicios disponibles',
        '3️⃣ Hablar con un humano'
    ]);

const schedulingFlow = addKeyword(['1', 'agendar', 'cita', 'agendar cita'])
    .addAnswer('📅 Perfecto, vamos a agendar tu cita.', null, async (ctx) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Mensaje recibido en schedulingFlow de usuario ${ctx.from}: ${ctx.body}`);
    })
    .addAnswer('¿Cuál es tu nombre completo?', { capture: true }, async (ctx, { state }) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Capturando nombre de usuario ${ctx.from}: ${ctx.body}`);
        state.update({ name: ctx.body });
    })
    .addAnswer('¿Cuál es tu número de teléfono?', { capture: true }, async (ctx, { state }) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Capturando teléfono de usuario ${ctx.from}: ${ctx.body}`);
        state.update({ phone: ctx.body });
    })
    .addAnswer('¿Qué tipo de servicio necesitas? (Ejemplo: Reparación de laptop, instalación de software, etc.)', { capture: true }, async (ctx, { state }) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Capturando servicio de usuario ${ctx.from}: ${ctx.body}`);
        state.update({ service: ctx.body });
    })
    .addAnswer('¿Qué fecha prefieres? (Formato: DD/MM/YYYY)', { capture: true }, async (ctx, { state }) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Capturando fecha de usuario ${ctx.from}: ${ctx.body}`);
        state.update({ date: ctx.body });
    })
    .addAnswer('¿A qué hora? (Formato: HH:MM)', { capture: true }, async (ctx, { state, flowDynamic }) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Capturando hora de usuario ${ctx.from}: ${ctx.body}`);
        
        const myState = state.getMyState();
        const appointmentData = {
            name: myState.name,
            phone: myState.phone,
            service: myState.service,
            date: myState.date,
            time: ctx.body,
            timestamp: new Date().toISOString()
        };

        try {
            console.log('💾 Guardando cita en Google Sheets:', appointmentData);
            await appendToSheet([
                appointmentData.name,
                appointmentData.phone,
                appointmentData.service,
                appointmentData.date,
                appointmentData.time,
                appointmentData.timestamp
            ]);
            console.log('✅ Cita guardada exitosamente en Google Sheets');
            
            await flowDynamic([
                '✅ ¡Cita agendada exitosamente!',
                `📝 Resumen:`,
                `👤 Nombre: ${appointmentData.name}`,
                `📞 Teléfono: ${appointmentData.phone}`,
                `🔧 Servicio: ${appointmentData.service}`,
                `📅 Fecha: ${appointmentData.date}`,
                `⏰ Hora: ${appointmentData.time}`,
                '',
                'Te esperamos. ¡Gracias por confiar en nosotros! 😊'
            ]);
        } catch (error) {
            console.error('❌ Error al guardar cita:', error);
            await flowDynamic('❌ Hubo un error al agendar tu cita. Por favor, intenta de nuevo o contacta con soporte.');
        }
    });

const servicesFlow = addKeyword(['2', 'servicios', 'ver servicios'])
    .addAnswer('🔧 Nuestros servicios disponibles:', null, async (ctx) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Mensaje recibido en servicesFlow de usuario ${ctx.from}: ${ctx.body}`);
    })
    .addAnswer([
        '💻 Reparación de computadoras',
        '📱 Reparación de celulares',
        '🖨️ Instalación de software',
        '🔌 Mantenimiento preventivo',
        '🌐 Configuración de redes',
        '',
        'Escribe "1" para agendar una cita'
    ]);

const humanFlow = addKeyword(['3', 'humano', 'hablar con humano', 'agente'])
    .addAnswer('👤 Te estamos conectando con un agente humano...', null, async (ctx) => {
        messageCount++;
        console.log(`📩 [${messageCount}] Mensaje recibido en humanFlow de usuario ${ctx.from}: ${ctx.body}`);
        console.log('🔔 ALERTA: Usuario solicita hablar con humano');
    })
    .addAnswer('Un agente se pondrá en contacto contigo pronto. Por favor, espera un momento.');

const main = async () => {
    try {
        console.log('🔧 Configurando flujos del bot...');
        const adapterFlow = createFlow([welcomeFlow, schedulingFlow, servicesFlow, humanFlow]);
        
        console.log('📱 Configurando proveedor de WhatsApp (Baileys)...');
        const adapterProvider = createProvider(BaileysProvider);
        
        console.log('💾 Configurando base de datos...');
        const adapterDB = { find: () => null, save: () => null, init: () => null };

        console.log('🤖 Creando bot...');
        console.log('⏳ Esperando generación del código QR de WhatsApp...');
        console.log('📍 El QR debería aparecer a continuación en los próximos 30-60 segundos...');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('                    CÓDIGO QR DE WHATSAPP                  ');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        
        const bot = await createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        });
        
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('✅ Bot de WhatsApp iniciado correctamente');
        console.log('📲 Si viste el código QR arriba, escanéalo con WhatsApp');
        console.log('🔍 Si no apareció el QR, puede que ya exista una sesión guardada');
        console.log('🔍 Estructura del bot:', Object.keys(bot || {}));
        console.log('🔍 Proveedor disponible:', bot?.provider ? 'Sí' : 'No');
        
        // Mantener el proceso activo
        setInterval(() => {
            const now = new Date().toISOString();
            const status = connected ? '🟢 Conectado' : (qrGenerated ? '🟡 QR generado' : '🔴 Esperando QR');
            console.log(`💓 Bot de WhatsApp activo - ${now} - ${status} - Mensajes: ${messageCount}`);
        }, 60000); // Log cada 60 segundos
        
    } catch (error) {
        console.error('❌ Error al iniciar el bot de WhatsApp:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

main();
