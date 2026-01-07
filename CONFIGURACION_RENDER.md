# Guía de Configuración para Render.com - Ambos Bots

## 🎯 Objetivo

Esta guía te ayudará a ejecutar **ambos bots** (WhatsApp y Telegram) simultáneamente en Render.com usando PM2.

## 📋 Variables de Entorno Requeridas

### Variables Obligatorias (para ambos bots):

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu_email@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nTU_CLAVE_AQUI\n-----END PRIVATE KEY-----
GOOGLE_SHEET_ID=tu_id_de_google_sheet
```

### Variable para Telegram (obligatoria si usas Telegram):

```env
TELEGRAM_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

## ⚠️ IMPORTANTE: Formato de GOOGLE_PRIVATE_KEY

La clave privada debe estar en **UNA SOLA LÍNEA** con `\n` donde van los saltos de línea:

**❌ INCORRECTO (múltiples líneas):**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQE...
...más líneas...
-----END PRIVATE KEY-----
```

**✅ CORRECTO (una sola línea con \n):**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n...más contenido...\n-----END PRIVATE KEY-----
```

### Cómo obtener el formato correcto:

1. Abre tu archivo JSON de credenciales de Google
2. Busca el campo `private_key`
3. Copia el valor completo (ya viene con `\n`)
4. Pégalo directamente en Render sin modificar

## 🚀 Configuración en Render.com

### Paso 1: Configurar el Background Worker

1. **Ve a tu Background Worker en Render**
2. **Haz clic en "Settings"**
3. **Configura estos valores:**

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm install` |
| **Start Command** | `npm run pm2` |

### Paso 2: Agregar Variables de Entorno

1. **Ve a la sección "Environment"**
2. **Haz clic en "Add Environment Variable"**
3. **Agrega cada variable:**

```
GOOGLE_SERVICE_ACCOUNT_EMAIL = tu_email@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nTU_CLAVE\n-----END PRIVATE KEY-----
GOOGLE_SHEET_ID = tu_id_del_sheet
TELEGRAM_TOKEN = tu_token_de_telegram
```

### Paso 3: Guardar y Desplegar

1. **Haz clic en "Save Changes"**
2. **Render automáticamente hará un nuevo deploy**
3. **Ve a la pestaña "Logs"** para ver el progreso

## 📊 Verificar que Funciona

En los logs deberías ver algo como esto:

```
🚀 Iniciando Bot de WhatsApp...
📋 Variables de entorno cargadas:
  - GOOGLE_SERVICE_ACCOUNT_EMAIL: ✅ Configurado
  - GOOGLE_PRIVATE_KEY: ✅ Configurado
  - GOOGLE_SHEET_ID: ✅ Configurado
🔧 Configurando flujos del bot...
📱 Configurando proveedor de WhatsApp (Baileys)...
💾 Configurando base de datos...
🤖 Creando bot...
✅ Bot de WhatsApp iniciado correctamente
📲 Escanea el código QR que aparecerá arriba para conectar WhatsApp

🚀 Iniciando Bot de Telegram...
📋 Variables de entorno cargadas:
  - TELEGRAM_TOKEN: ✅ Configurado
  - GOOGLE_SERVICE_ACCOUNT_EMAIL: ✅ Configurado
  - GOOGLE_PRIVATE_KEY: ✅ Configurado
  - GOOGLE_SHEET_ID: ✅ Configurado
🔧 Configurando flujos del bot...
📡 Configurando proveedor de Telegram...
💾 Configurando base de datos...
🤖 Creando bot...
✅ Bot de Telegram iniciado correctamente
📨 El bot está listo para recibir mensajes en Telegram
```

## 🔍 Solución de Problemas

### Problema 1: Variables de entorno NO configuradas

**Síntoma en logs:**
```
❌ NO configurado
```

**Solución:**
- Verifica que agregaste todas las variables en Settings → Environment
- Asegúrate de hacer clic en "Save Changes"
- Haz un nuevo deploy manualmente

### Problema 2: Error de Google Sheets

**Síntoma en logs:**
```
Error al conectar con Google Sheets
```

**Solución:**
1. Verifica que `GOOGLE_PRIVATE_KEY` esté en el formato correcto (con `\n`)
2. Verifica que el email de servicio tenga permisos en el Google Sheet
3. Verifica que el ID del sheet sea correcto

### Problema 3: Bot de Telegram no responde

**Síntoma:**
El bot aparece online pero no responde a mensajes

**Solución:**
1. Verifica que `TELEGRAM_TOKEN` sea correcto
2. Verifica que el token sea de un bot activo en BotFather
3. Envía el comando `/start` al bot

### Problema 4: No aparece el QR de WhatsApp

**Síntoma:**
Los logs dicen que el bot inició pero no hay QR

**Solución:**
- El QR puede tardar 30-60 segundos en generarse
- Busca en los logs más arriba, puede estar oculto
- Si ya escaneaste el QR antes, puede que la sesión esté guardada

## 📱 Cómo Obtener el Token de Telegram

1. Abre Telegram y busca **@BotFather**
2. Envía el comando `/newbot`
3. Sigue las instrucciones para crear tu bot
4. BotFather te dará un token como: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
5. Copia ese token y úsalo como `TELEGRAM_TOKEN`

## 📝 Cómo Obtener las Credenciales de Google Sheets

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de Google Sheets
4. Ve a "Credenciales" → "Crear credenciales" → "Cuenta de servicio"
5. Descarga el archivo JSON de credenciales
6. Abre el archivo JSON y copia:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`
7. Comparte tu Google Sheet con el email de servicio (con permisos de edición)
8. Copia el ID del sheet desde la URL: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit`

## 🎯 Comandos Útiles

### Para ejecutar solo WhatsApp:
```bash
Start Command: node app.js
```

### Para ejecutar solo Telegram:
```bash
Start Command: node telegram_app.js
```

### Para ejecutar ambos (recomendado):
```bash
Start Command: npm run pm2
```

## 📊 Estructura del Google Sheet

Tu Google Sheet debe tener estas columnas en la primera fila:

| Timestamp | Nombre | Telefono_ID | Servicio | Equipo | Problema | Horario | Estado |
|-----------|--------|-------------|----------|--------|----------|---------|--------|

El bot agregará automáticamente nuevas filas cuando los usuarios agenden citas.

## ✅ Checklist Final

Antes de desplegar, verifica:

- [ ] Variables de entorno agregadas en Render
- [ ] `GOOGLE_PRIVATE_KEY` en formato correcto (una línea con `\n`)
- [ ] Email de servicio tiene acceso al Google Sheet
- [ ] Token de Telegram es válido (si usas Telegram)
- [ ] Start Command es `npm run pm2`
- [ ] Build Command es `npm install`

---

**¡Listo!** Ambos bots deberían estar funcionando correctamente. 🎉

Si tienes problemas, revisa los logs en la pestaña "Logs" de Render y busca mensajes de error específicos.
