import { createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot';

console.log('🚀 Iniciando Bot de Telegram...');
console.log('📋 Variables de entorno cargadas:');
console.log('  - TELEGRAM_TOKEN:', process.env.TELEGRAM_TOKEN ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✅ Configurado' : '❌ NO configurado');
import { TelegramProvider } from '@builderbot-plugins/telegram';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { isWithinBusinessHours, isSlotAvailable, parseDateTime } from './utils.js';
import { saveToSheet } from './googleSheets.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const saveAppointment = async (data) => {
    // Guardar en CSV local como respaldo
    const filePath = path.join(__dirname, 'citas_agendadas.csv');
    const header = 'Timestamp,Nombre,ID_Telegram,Servicio,Equipo,Problema,Horario,Estado\n';
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, header);
    const row = `${new Date().toISOString()},${data.name},${data.telegramId},${data.service},${data.device},${data.problem},${data.timeISO},Pendiente\n`;
    fs.appendFileSync(filePath, row);

    // Guardar en Google Sheets
    await saveToSheet(data);
};

const servicesFlow = addKeyword(['Consultar Servicios', 'servicios'])
    .addAnswer([
        '🛠️ *Nuestros Servicios:*',
        '',
        '*1. Hardware:* Reparación de pantallas, teclados, baterías. Desde $50.',
        '*2. Software:* Formateo, eliminación de virus, instalación de programas. $30.',
        '*3. Mantenimiento:* Limpieza física y térmica profunda. $40.'
    ], {
        buttons: [
            { body: 'Agendar Cita' },
            { body: 'Menu Principal' }
        ]
    });

const humanFlow = addKeyword(['Hablar con un Técnico', 'tecnico', 'ayuda'])
    .addAnswer('Entendido. Un técnico se pondrá en contacto contigo a través de este chat de Telegram lo antes posible. 👨‍🔧');

const schedulingFlow = addKeyword(['Agendar Cita', 'agendar'])
    .addAnswer('¡Excelente! ¿Qué tipo de servicio necesitas?', {
        buttons: [
            { body: 'Hardware' },
            { body: 'Software' },
            { body: 'Mantenimiento' }
        ]
    }, async (ctx, { state }) => {
        await state.update({ service: ctx.body });
    })
    .addAnswer('¿Cuál es la marca y modelo de tu equipo?', { capture: true }, async (ctx, { state }) => {
        await state.update({ device: ctx.body });
    })
    .addAnswer('Describe brevemente el problema:', { capture: true }, async (ctx, { state }) => {
        await state.update({ problem: ctx.body });
    })
    .addAnswer('¿Cuál es tu nombre completo?', { capture: true }, async (ctx, { state }) => {
        await state.update({ name: ctx.body });
    })
    .addAnswer([
        '📅 *Horario de Atención:*',
        'Lun-Vie: 9am - 5pm',
        'Sáb: 9am - 12pm',
        '',
        'Por favor, ingresa la fecha y hora deseada.',
        'Formato: *DIA/MES HORA:MIN*',
        'Ejemplo: *15/01 10:30*'
    ], { capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {
        const date = parseDateTime(ctx.body);
        
        if (!date) {
            return fallBack('❌ Formato inválido. Por favor usa: *DIA/MES HORA:MIN* (ej: 15/01 10:30)');
        }

        if (!isWithinBusinessHours(date)) {
            return fallBack('❌ Fuera de horario de atención. Por favor elige otra hora.');
        }

        const available = await isSlotAvailable(date);
        if (!available) {
            return fallBack('❌ Horario ya reservado. Por favor elige otra hora.');
        }

        await state.update({ 
            time: date.toLocaleString(), 
            timeISO: date.toISOString(),
            telegramId: ctx.from 
        });
        
        const currentState = state.getMyState();
        await saveAppointment(currentState);
        
        await flowDynamic(`¡Listo *${currentState.name}*! Tu cita para *${currentState.service}* ha sido registrada para el: *${date.toLocaleString()}*.`);
        await flowDynamic('Te recordamos que cada cita tiene una duración de 60 minutos. ¡Te esperamos! 💻');
    });

const welcomeFlow = addKeyword(['/start', 'hola', 'menu', 'Menu Principal'])
    .addAnswer([
        '👋 ¡Hola! Bienvenido al servicio técnico de computadores en Telegram.',
        'Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?'
    ], {
        buttons: [
            { body: 'Agendar Cita' },
            { body: 'Consultar Servicios' },
            { body: 'Hablar con un Técnico' }
        ]
    }, null, [schedulingFlow, servicesFlow, humanFlow]);

const main = async () => {
    try {
        console.log('🔧 Configurando flujos del bot...');
        const adapterFlow = createFlow([welcomeFlow, schedulingFlow, servicesFlow, humanFlow]);
        
        console.log('📡 Configurando proveedor de Telegram...');
        const adapterProvider = createProvider(TelegramProvider, {
            token: process.env.TELEGRAM_TOKEN || 'TU_TOKEN_DE_TELEGRAM'
        });

        console.log('💾 Configurando base de datos...');
        const adapterDB = { find: () => null, save: () => null, init: () => null };

        console.log('🤖 Creando bot...');
        await createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        });
        
        console.log('✅ Bot de Telegram iniciado correctamente');
        console.log('📨 El bot está listo para recibir mensajes en Telegram');
    } catch (error) {
        console.error('❌ Error al iniciar el bot de Telegram:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

main();
