import { getAppointmentsFromSheet } from './googleSheets.js';

const BUSINESS_HOURS = {
    1: { open: 9, close: 17 }, // Lunes
    2: { open: 9, close: 17 }, // Martes
    3: { open: 9, close: 17 }, // Miércoles
    4: { open: 9, close: 17 }, // Jueves
    5: { open: 9, close: 17 }, // Viernes
    6: { open: 9, close: 12 }, // Sábado
    0: null                    // Domingo (Cerrado)
};

const isWithinBusinessHours = (date) => {
    const day = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    const schedule = BUSINESS_HOURS[day];
    if (!schedule) return false;
    
    const timeInDecimal = hours + (minutes / 60);
    return timeInDecimal >= schedule.open && timeInDecimal < schedule.close;
};

/**
 * Verifica disponibilidad consultando Google Sheets
 */
const isSlotAvailable = async (requestedDate) => {
    const appointments = await getAppointmentsFromSheet();
    
    const requestedTime = requestedDate.getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    
    for (const app of appointments) {
        const appointmentDate = new Date(app.horario);
        if (isNaN(appointmentDate.getTime())) continue;
        
        const appointmentTime = appointmentDate.getTime();
        if (Math.abs(requestedTime - appointmentTime) < ONE_HOUR) {
            return false;
        }
    }
    
    return true;
};

const parseDateTime = (input) => {
    const now = new Date();
    const parts = input.split(' ');
    if (parts.length < 2) return null;
    
    const [datePart, timePart] = parts;
    const [day, month] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    if (isNaN(day) || isNaN(month) || isNaN(hour) || isNaN(minute)) return null;
    
    const date = new Date(now.getFullYear(), month - 1, day, hour, minute);
    return date;
};

export {
    isWithinBusinessHours,
    isSlotAvailable,
    parseDateTime,
    BUSINESS_HOURS
};
