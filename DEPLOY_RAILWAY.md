# Guía de Despliegue en Railway.app

## 🚀 Paso a Paso para Desplegar en Railway

### Paso 1: Crear Nuevo Proyecto en Railway

1. **Ve a Railway:** https://railway.app/
2. **Inicia sesión** con tu cuenta de GitHub
3. Haz clic en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Busca y selecciona: **`jfredysalazar-proyectos/mi-chatbot-reparacion`**
6. Haz clic en **"Deploy Now"**

Railway detectará automáticamente que es un proyecto Node.js y comenzará el despliegue.

### Paso 2: Configurar Variables de Entorno

Una vez que el proyecto esté creado:

1. **Haz clic en tu proyecto** en el dashboard
2. **Haz clic en la pestaña "Variables"**
3. **Agrega las siguientes variables:**

#### Variables Requeridas:

```
TELEGRAM_TOKEN
```
**Valor:** Tu token completo de Telegram (ejemplo: `8219131617:AAGKuXv7P8ohYnQlmfuPj5sxPrvMl7COrKk`)

```
GOOGLE_SERVICE_ACCOUNT_EMAIL
```
**Valor:** El email de tu cuenta de servicio de Google (ejemplo: `tu-proyecto@tu-proyecto.iam.gserviceaccount.com`)

```
GOOGLE_PRIVATE_KEY
```
**Valor:** La clave privada de Google (debe estar en UNA SOLA LÍNEA con `\n` donde van los saltos de línea)

**Ejemplo:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

```
GOOGLE_SHEET_ID
```
**Valor:** El ID de tu Google Sheet (ejemplo: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`)

4. **Haz clic en "Add" después de cada variable**

### Paso 3: Verificar el Despliegue

1. **Ve a la pestaña "Deployments"**
2. **Haz clic en el último deployment**
3. **Revisa los logs**

Deberías ver:

```
🚀 Iniciando Bot de Telegram...
📋 Variables de entorno cargadas:
  - TELEGRAM_TOKEN: ✅ Configurado
  - GOOGLE_SERVICE_ACCOUNT_EMAIL: ✅ Configurado
  - GOOGLE_PRIVATE_KEY: ✅ Configurado
  - GOOGLE_SHEET_ID: ✅ Configurado
✅ Bot de Telegram iniciado correctamente
📨 El bot está listo para recibir mensajes en Telegram

🚀 Iniciando Bot de WhatsApp...
📋 Variables de entorno cargadas:
  - GOOGLE_SERVICE_ACCOUNT_EMAIL: ✅ Configurado
  - GOOGLE_PRIVATE_KEY: ✅ Configurado
  - GOOGLE_SHEET_ID: ✅ Configurado
⏳ Esperando generación del código QR de WhatsApp...

═══════════════════════════════════════════════════════════
                    CÓDIGO QR DE WHATSAPP                  
═══════════════════════════════════════════════════════════

[AQUÍ DEBERÍA APARECER EL QR]

═══════════════════════════════════════════════════════════
```

### Paso 4: Escanear el QR de WhatsApp

1. **Busca el código QR en los logs** (puede tardar 30-60 segundos en aparecer)
2. **Abre WhatsApp** en tu teléfono
3. Ve a **Configuración** → **Dispositivos vinculados** → **Vincular dispositivo**
4. **Escanea el QR** que aparece en los logs de Railway

### Paso 5: Probar el Bot de Telegram

1. **Abre Telegram** y busca tu bot: @servicio_tecnico_myf_Bot
2. **Envía:** `hola` o `/start`
3. **El bot debería responder** con el menú de opciones

### Paso 6: Verificar los Logs

En Railway, ve a la pestaña **"Logs"** y deberías ver:

```
📩 [1] Mensaje recibido en welcomeFlow de usuario 123456789: hola
💓 Bot de Telegram activo - 2026-01-07T23:49:14.333Z - Mensajes procesados: 1
💓 Bot de WhatsApp activo - 2026-01-07T23:49:15.022Z - 🟢 Conectado - Mensajes: 0
```

## 🔧 Solución de Problemas

### Si el despliegue falla:

**Error: "Build failed"**
- Verifica que el repositorio esté actualizado
- Revisa los logs de build para ver el error específico

**Error: "Start command failed"**
- Verifica que todas las dependencias estén en `package.json`
- Revisa que el comando `npm run pm2` funcione

### Si el bot no responde:

**Telegram no responde:**
1. Verifica que `TELEGRAM_TOKEN` esté configurado correctamente
2. Revoca el token actual en @BotFather y crea uno nuevo
3. Verifica que el bot no esté corriendo en otro lugar (Render)

**WhatsApp no muestra QR:**
1. Espera al menos 2 minutos completos
2. Busca el QR más arriba en los logs
3. Si no aparece después de 5 minutos, puede ser un problema de Baileys

### Si las variables de entorno no se cargan:

1. Verifica que no haya espacios antes o después de los valores
2. Para `GOOGLE_PRIVATE_KEY`, asegúrate de que los `\n` estén correctos
3. Haz un nuevo deploy después de agregar variables: **Settings** → **Redeploy**

## 📊 Monitoreo

Railway proporciona:

- **Logs en tiempo real** - Ve qué está pasando con tus bots
- **Métricas** - CPU, memoria, red
- **Alertas** - Te notifica si algo falla

## 💰 Costos

Railway ofrece:

- **$5 USD de crédito gratis** cada mes
- **Uso basado en recursos** - Solo pagas por lo que usas
- Este proyecto debería costar **menos de $5/mes**

## 🔄 Actualizaciones

Cada vez que hagas `git push` a tu repositorio:

1. Railway detectará el cambio automáticamente
2. Hará un nuevo build
3. Desplegará la nueva versión

**No necesitas hacer nada manual.**

## 🎯 Checklist Final

Antes de considerar que todo funciona:

- [ ] Proyecto desplegado en Railway sin errores
- [ ] Variables de entorno configuradas (4 variables)
- [ ] Logs muestran "✅ Bot iniciado correctamente" para ambos bots
- [ ] QR de WhatsApp apareció en los logs
- [ ] QR escaneado con WhatsApp
- [ ] Bot de Telegram responde a mensajes
- [ ] Bot de WhatsApp responde a mensajes
- [ ] Puedes agendar una cita en ambos bots
- [ ] Las citas se guardan en Google Sheets

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** en Railway (pestaña "Logs")
2. **Comparte los logs** para diagnosticar
3. **Comunidad de BuilderBot:** https://link.codigoencasa.com/DISCORD
4. **Documentación de Railway:** https://docs.railway.app/

---

¡Listo! Tu chatbot debería estar funcionando en Railway. 🎉
