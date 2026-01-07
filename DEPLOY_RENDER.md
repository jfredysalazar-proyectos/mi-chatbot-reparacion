# Guía de Despliegue en Render.com

## Problema Resuelto

Se corrigió el error `ERR_REQUIRE_ESM` que ocurría porque el proyecto tenía una configuración mixta entre CommonJS y ES Modules. Todos los archivos han sido convertidos a **ES Modules (ESM)** para ser compatibles con las dependencias modernas como `baileys`.

## Cambios Realizados

### 1. Archivos Convertidos a ES Modules

Los siguientes archivos fueron convertidos de CommonJS (`require()`) a ES Modules (`import/export`):

- ✅ `app.js` - Bot de WhatsApp
- ✅ `telegram_app.js` - Bot de Telegram
- ✅ `utils.js` - Utilidades
- ✅ `googleSheets.js` - Integración con Google Sheets

### 2. Archivos Eliminados

Se eliminaron los archivos `.cjs` y `.bak` que causaban conflictos:

- ❌ `app.cjs`
- ❌ `telegram_app.cjs`
- ❌ `utils.cjs`
- ❌ `googleSheets.cjs`
- ❌ `app.js.bak`
- ❌ `telegram_app.js.bak`

### 3. Cambios Principales

**Antes (CommonJS):**
```javascript
const { createBot } = require('@builderbot/bot');
const { BaileysProvider } = require('@builderbot/provider-baileys');
module.exports = { function };
```

**Después (ES Modules):**
```javascript
import { createBot } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
export { function };
```

## Instrucciones de Despliegue en Render.com

### Paso 1: Subir los Cambios a GitHub

Desde tu computadora local, ejecuta los siguientes comandos en la terminal dentro de la carpeta del proyecto:

```bash
git add .
git commit -m "Fix: Convertir proyecto a ES Modules para resolver ERR_REQUIRE_ESM"
git push origin main
```

### Paso 2: Configurar Render.com

1. **Accede a tu dashboard de Render.com**
   - Ve a https://dashboard.render.com

2. **Selecciona tu servicio existente** o crea uno nuevo:
   - Si ya existe: Ve a tu servicio y haz clic en "Settings"
   - Si es nuevo: Haz clic en "New +" → "Web Service"

3. **Conecta tu repositorio de GitHub**
   - Selecciona: `jfredysalazar-proyectos/mi-chatbot-reparacion`

4. **Configura el servicio con estos valores:**

   | Campo | Valor |
   |-------|-------|
   | **Name** | `mi-chatbot-reparacion` (o el nombre que prefieras) |
   | **Region** | Selecciona la más cercana a tus usuarios |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node app.js` |
   | **Instance Type** | `Free` o el plan que prefieras |

5. **Variables de Entorno (Environment Variables)**

   Agrega las siguientes variables en la sección "Environment":

   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL=tu_email_de_servicio@proyecto.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA\n-----END PRIVATE KEY-----
   GOOGLE_SHEET_ID=tu_id_de_google_sheet
   ```

   **Para WhatsApp:** No necesitas variables adicionales (usa QR)
   
   **Para Telegram:** Si quieres usar el bot de Telegram en lugar de WhatsApp, agrega:
   ```
   TELEGRAM_TOKEN=tu_token_de_telegram
   ```
   Y cambia el **Start Command** a: `node telegram_app.js`

### Paso 3: Desplegar

1. Haz clic en **"Create Web Service"** (si es nuevo) o **"Save Changes"** (si ya existe)
2. Render automáticamente comenzará el despliegue
3. Espera a que el estado cambie a **"Live"** (puede tomar 2-5 minutos)

### Paso 4: Verificar el Despliegue

1. Ve a la pestaña **"Logs"** en tu servicio de Render
2. Deberías ver mensajes como:
   ```
   [INFO] Bot iniciado correctamente
   [INFO] Escanea el código QR para conectar WhatsApp
   ```
3. Si ves el código QR en los logs, escanéalo con WhatsApp para conectar el bot

## Comandos para Diferentes Bots

### Para WhatsApp (por defecto):
```bash
Start Command: node app.js
```

### Para Telegram:
```bash
Start Command: node telegram_app.js
```

### Para ambos (requiere PM2):
```bash
Build Command: npm install && npm install -g pm2
Start Command: pm2-runtime start ecosystem.config.js
```

## Solución de Problemas

### Si el error persiste:

1. **Verifica que el archivo `package.json` tenga:**
   ```json
   {
     "type": "module"
   }
   ```

2. **Verifica que todos los imports tengan la extensión `.js`:**
   ```javascript
   import { function } from './utils.js';  // ✅ Correcto
   import { function } from './utils';     // ❌ Incorrecto en ESM
   ```

3. **Limpia el caché de Render:**
   - En tu servicio de Render, ve a "Settings"
   - Haz clic en "Clear build cache & deploy"

4. **Verifica los logs:**
   - Ve a la pestaña "Logs" en Render
   - Busca mensajes de error específicos

### Si necesitas soporte adicional:

- Revisa la documentación de Render: https://render.com/docs
- Verifica la documentación de BuilderBot: https://builderbot.vercel.app

## Notas Importantes

- ✅ El proyecto ahora usa **ES Modules** completamente
- ✅ Compatible con Node.js 20.x
- ✅ Compatible con las últimas versiones de `baileys` y `@builderbot`
- ⚠️ Asegúrate de tener todas las variables de entorno configuradas
- ⚠️ Para WhatsApp, necesitarás escanear el código QR cada vez que se reinicie el servicio (considera usar una base de datos para persistir la sesión)

## Estructura del Proyecto

```
mi-chatbot-reparacion/
├── app.js              # Bot de WhatsApp (ES Module)
├── telegram_app.js     # Bot de Telegram (ES Module)
├── utils.js            # Funciones de utilidad (ES Module)
├── googleSheets.js     # Integración con Google Sheets (ES Module)
├── package.json        # Configuración del proyecto (type: module)
├── .env.example        # Ejemplo de variables de entorno
└── ecosystem.config.js # Configuración de PM2 (opcional)
```

---

**¡Listo!** Tu chatbot debería estar funcionando correctamente en Render.com sin el error `ERR_REQUIRE_ESM`.
