import { createBot, createProvider, createFlow, addKeyword } from '@builderbot/bot';

console.log('🚀 Iniciando Bot de WhatsApp...');
console.log('📋 Variables de entorno cargadas:');
console.log('  - GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Configurado' : '❌ NO configurado');
console.log('  - GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '✅ Configurado' : '❌ NO configurado');
import { BaileysProvider } from '@builderbot/provider-baileys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isWithinBusinessHours, isSlotAvailable, parseDateTime } from './utils.js';
import { saveToSheet } from './googleSheets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const saveAppointment = async (data) => {
    // Guardar en CSV local como respaldo
    const filePath = path.join(__dirname, 'citas_agendadas.csv');
    const header = 'Timestamp,Nombre,Telefono,Servicio,Equipo,Problema,Horario,Estado\n';
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, header);
    const row = `${new Date().toISOString()},${data.name},${data.phone},${data.service},${data.device},${data.problem},${data.timeISO},Pendiente\n`;
    fs.appendFileSync(filePath, row);

    // Guardar en Google Sheets
    await saveToSheet(data);
};

const servicesFlow = addKeyword(['2', 'servicios', 'precios'])
    .addAnswer([
        '🛠️ *Nuestros Servicios:*',
        '',
        '*1. Hardware:* Reparación de pantallas, teclados, baterías. Desde $50.',
        '*2. Software:* Formateo, eliminación de virus, instalación de programas. $30.',
        '*3. Mantenimiento:* Limpieza física y térmica profunda. $40.',
        '',
        'Escribe *Agendar* para programar una cita o *Menu* para volver.'
    ]);

const humanFlow = addKeyword(['3', 'humano', 'tecnico', 'ayuda'])
    .addAnswer('Entendido. Un técnico se pondrá en contacto contigo a este número lo antes posible. 👨‍🔧');

const schedulingFlow = addKeyword(['1', 'agendar', 'cita'])
    .addAnswer('¡Excelente! ¿Qué tipo de servicio necesitas? (Hardware, Software o Mantenimiento)', { capture: true }, async (ctx, { state }) => {
        await state.update({ service: ctx.body });
    })
    .addAnswer('¿Marca y modelo de tu equipo?', { capture: true }, async (ctx, { state }) => {
        await state.update({ device: ctx.body });
    })
    .addAnswer('Describe el problema:', { capture: true }, async (ctx, { state }) => {
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
            return fallBack('❌ Lo sentimos, esa hora está fuera de nuestro horario de atención. Por favor elige otra.');
        }

        const available = await isSlotAvailable(date);
        if (!available) {
            return fallBack('❌ Lo sentimos, ese horario ya está reservado. Por favor elige otra hora.');
        }

        await state.update({ 
            time: date.toLocaleString(), 
            timeISO: date.toISOString(),
            phone: ctx.from 
        });
        
        const currentState = state.getMyState();
        await saveAppointment(currentState);
        
        await flowDynamic(`¡Listo *${currentState.name}*! Tu cita para *${currentState.service}* ha sido registrada para el: *${date.toLocaleString()}*.`);
        await flowDynamic('Te recordamos que cada cita tiene una duración estimada de 60 minutos. ¡Te esperamos! 💻');
    });

const welcomeFlow = addKeyword(['hola', 'ole', 'buenas', 'menu', 'inicio'])
    .addAnswer([
        '👋 ¡Hola! Bienvenido al servicio técnico de computadores.',
        'Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        '',
        '1. 📅 *Agendar Cita*',
        '2. 🛠️ *Consultar Servicios*',
        '3. 👨‍🔧 *Hablar con un Técnico*',
        '',
        'Responde con el número de tu opción.'
    ], null, null, [schedulingFlow, servicesFlow, humanFlow]);

const main = async () => {
    try {
        console.log('🔧 Configurando flujos del bot...');
        const adapterFlow = createFlow([welcomeFlow, schedulingFlow, servicesFlow, humanFlow]);
        
        console.log('📱 Configurando proveedor de WhatsApp (Baileys)...');
        const adapterProvider = createProvider(BaileysProvider);
        
        console.log('💾 Configurando base de datos...');
        const adapterDB = { find: () => null, save: () => null, init: () => null };

        console.log('🤖 Creando bot...');
        await createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        });
        
        console.log('✅ Bot de WhatsApp iniciado correctamente');
        console.log('📲 Escanea el código QR que aparecerá arriba para conectar WhatsApp');
        
        // Mantener el proceso activo
        setInterval(() => {
            console.log('💓 Bot de WhatsApp activo -', new Date().toISOString());
        }, 60000); // Log cada 60 segundos
        
    } catch (error) {
        console.error('❌ Error al iniciar el bot de WhatsApp:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

main();
