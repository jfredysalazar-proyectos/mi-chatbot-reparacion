import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const getDoc = async ( ) => {
    try {
        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

const saveToSheet = async (data) => {
    const doc = await getDoc();
    if (!doc) return false;
    const sheet = doc.sheetsByIndex[0];
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

const getAppointmentsFromSheet = async () => {
    const doc = await getDoc();
    if (!doc) return [];
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    return rows.map(row => ({ horario: row.get('Horario') }));
};

const appendToSheet = async (rowData) => {
    const doc = await getDoc();
    if (!doc) {
        console.error('No se pudo conectar con Google Sheets');
        return false;
    }
    
    try {
        const sheet = doc.sheetsByIndex[0];
        await sheet.addRow(rowData);
        return true;
    } catch (error) {
        console.error('Error al agregar fila a Google Sheets:', error);
        return false;
    }
};

export { saveToSheet, getAppointmentsFromSheet, appendToSheet };
