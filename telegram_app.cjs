const { createBot, createProvider, createFlow, addKeyword } = require('@builderbot/bot');
const { TelegramProvider } = require('@builderbot-plugins/telegram');
const fs = require('fs');
const path = require('path');
const { isWithinBusinessHours, isSlotAvailable, parseDateTime } = require('./utils');
const { saveToSheet } = require('./googleSheets');

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
        '*1. Hardware:* Reparación de Cargadores, cambio de teclados, Visagras, Daño Electrónico. Desde $30.000.',
        '*2. Software:* Formateo, eliminación de virus, instalación de programas. Desde $30.000',
        '*3. Mantenimiento:* Limpieza física y cambio de pasta térmica. Desde $40.000'
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
        '👋 ¡Hola! Bienvenido al servicio técnico de computadores en MYFIMPORT.',
        'Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?'
    ], {
        buttons: [
            { body: 'Agendar Cita' },
            { body: 'Consultar Servicios' },
            { body: 'Hablar con un Técnico' }
        ]
    }, null, [schedulingFlow, servicesFlow, humanFlow]);

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow, schedulingFlow, servicesFlow, humanFlow]);
    
    require('dotenv').config();
    const adapterProvider = createProvider(TelegramProvider, {
        token: process.env.TELEGRAM_TOKEN || '8219131617:AAGKuXv7P8ohYnQlmfuPj5sxPrvMl7COrKk'
    });

    const adapterDB = { find: () => null, save: () => null, init: () => null };

    await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });
};

main();
