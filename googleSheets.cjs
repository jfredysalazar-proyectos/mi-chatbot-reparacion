const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');
require('dotenv').config();

// Configuración de autenticación
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const getDoc = async () => {
    // Intentar cargar credenciales desde un archivo JSON o variables de entorno
    let credentials;
    try {
        const credsFile = path.join(__dirname, 'google-creds.json');
        if (require('fs').existsSync(credsFile)) {
            credentials = require(credsFile);
        } else {
            // Fallback a variables de entorno si no hay archivo
            credentials = {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            };
        }

        const auth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: SCOPES,
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
        await doc.loadInfo();
        return doc;
    } catch (error) {
        console.error('Error al conectar con Google Sheets:', error);
        return null;
    }
};

/**
 * Guarda una cita en Google Sheets
 */
const saveToSheet = async (data) => {
    const doc = await getDoc();
    if (!doc) return false;

    const sheet = doc.sheetsByIndex[0]; // Usar la primera hoja
    await sheet.addRow({
        Timestamp: new Date().toISOString(),
        Nombre: data.name,
        Telefono_ID: data.phone || data.telegramId,
        Servicio: data.service,
        Equipo: data.device,
        Problema: data.problem,
        Horario: data.timeISO,
        Estado: 'Pendiente'
    });
    return true;
};

/**
 * Obtiene todas las citas de la hoja para validar disponibilidad
 */
const getAppointmentsFromSheet = async () => {
    const doc = await getDoc();
    if (!doc) return [];

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    return rows.map(row => ({
        horario: row.get('Horario')
    }));
};

module.exports = {
    saveToSheet,
    getAppointmentsFromSheet
};
