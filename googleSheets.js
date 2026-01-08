import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Función para procesar la clave privada correctamente
function processPrivateKey(key) {
  if (!key) {
    throw new Error('GOOGLE_PRIVATE_KEY no está configurada');
  }
  
  console.log('🔑 Procesando clave privada...');
  console.log('📏 Longitud de la clave:', key.length);
  console.log('🔍 Primeros 50 caracteres:', key.substring(0, 50));
  
  // Si la clave ya tiene saltos de línea reales, devolverla tal cual
  if (key.includes('\n')) {
    console.log('✅ Formato detectado: Saltos de línea reales');
    return key;
  }
  
  // Si la clave tiene \\n (escapados), reemplazarlos por saltos de línea reales
  if (key.includes('\\n')) {
    console.log('✅ Formato detectado: \\\\n escapados, convirtiendo...');
    const converted = key.replace(/\\n/g, '\n');
    console.log('✅ Conversión completada');
    return converted;
  }
  
  console.log('⚠️ Formato desconocido, usando tal cual');
  return key;
}

// Función para obtener el documento de Google Sheets
const getDoc = async () => {
  try {
    console.log('🔄 Conectando con Google Sheets...');
    console.log('📧 Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('📄 Sheet ID:', process.env.GOOGLE_SHEET_ID);
    
    // Procesar la clave privada
    const privateKey = processPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    
    // Crear cliente de autenticación
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    // Crear instancia del documento
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    
    // Cargar información del documento
    console.log('📥 Cargando información del documento...');
    await doc.loadInfo();
    
    console.log('✅ Conectado exitosamente a:', doc.title);
    console.log('📊 Número de sheets:', doc.sheetCount);
    return doc;
  } catch (error) {
    console.error('❌ Error al conectar con Google Sheets');
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Código:', error.code);
    if (error.stack) {
      console.error('❌ Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    return null;
  }
};

// Función para agregar una fila al sheet
const appendToSheet = async (rowData) => {
  console.log('📝 Intentando guardar cita en Google Sheets...');
  console.log('📋 Datos a guardar:', JSON.stringify(rowData, null, 2));
  
  const doc = await getDoc();
  if (!doc) {
    console.error('❌ No se pudo conectar con Google Sheets');
    return false;
  }
  
  try {
    const sheet = doc.sheetsByIndex[0];
    console.log('📊 Sheet activo:', sheet.title);
    console.log('📏 Filas actuales:', sheet.rowCount);
    
    await sheet.addRow(rowData);
    console.log('✅ Cita guardada exitosamente en Google Sheets');
    return true;
  } catch (error) {
    console.error('❌ Error al agregar fila a Google Sheets');
    console.error('❌ Mensaje:', error.message);
    if (error.stack) {
      console.error('❌ Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    return false;
  }
};

// Función para guardar datos (compatibilidad con código anterior)
const saveToSheet = async (data) => {
  return await appendToSheet({
    Timestamp: new Date().toISOString(),
    Nombre: data.name,
    Telefono_ID: data.phone || data.telegramId,
    Username: data.username || 'N/A',
    Servicio: data.service,
    Equipo: data.device,
    Problema: data.problem,
    Horario: data.timeISO,
    Estado: 'Pendiente'
  });
};

// Función para obtener citas del sheet
const getAppointmentsFromSheet = async () => {
  const doc = await getDoc();
  if (!doc) {
    console.error('❌ No se pudo conectar con Google Sheets');
    return [];
  }
  
  try {
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    return rows.map(row => ({
      timestamp: row.get('Timestamp'),
      nombre: row.get('Nombre'),
      telefono: row.get('Telefono_ID'),
      username: row.get('Username'),
      servicio: row.get('Servicio'),
      equipo: row.get('Equipo'),
      problema: row.get('Problema'),
      horario: row.get('Horario'),
      estado: row.get('Estado')
    }));
  } catch (error) {
    console.error('❌ Error al leer Google Sheets:', error.message);
    return [];
  }
};

export { saveToSheet, getAppointmentsFromSheet, appendToSheet };
