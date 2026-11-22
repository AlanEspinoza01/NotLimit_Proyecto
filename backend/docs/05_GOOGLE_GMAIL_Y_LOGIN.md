# NoLimits — Google Identity Services y Gmail API

> Basado en los TXT exportados el 22-11-2026. Versión de integración de pruebas: requiere credenciales **propias** de Google Cloud. Nunca incluirlas en un ZIP, GitHub o en el frontend.

## Qué cambia

- Registro tradicional `/api/auth/register`: guarda usuario en MongoDB, crea la sesión HttpOnly y **después** intenta enviar una bienvenida mediante Gmail API. Un problema de Gmail no revierte el usuario.
- Acceso Google `/api/auth/google`: únicamente acepta `{ "credential": "ID_TOKEN_FIRMADO" }`, verifica firma, `aud`, `iss`, vigencia y `email_verified` utilizando `google-auth-library`, luego emite la cookie de sesión actual.
- `GET /api/auth/google/config`: entrega **solo el Client ID público** al botón de Google Identity Services. No entrega secretos.
- El botón oficial de Google aparece dentro de `AuthView` (ventana Windows XP). Se conserva acceso tradicional, permisos, puntos, cookies y usuarios existentes.
- Si el usuario se creó por primera vez con Google, también recibe bienvenida; en logins posteriores no se reenvía el mensaje.
- Usuarios administrativos no pueden usar este acceso federado; deben seguir por el mecanismo administrativo existente.

## 1. Preparar Google Cloud

1. Entra a https://console.cloud.google.com/ y selecciona o crea el proyecto de **NoLimits**.
2. En **Google Auth Platform**, configura Branding: nombre **NoLimits**, correo de soporte y dominios/autorizaciones solicitados. En **Audience**, usa **External** si tus clientes usarán cuentas personales. En pruebas, incorpora tus cuentas a **Test users**.
3. Configura los dominios autorizados y las URLs públicas de privacidad y condiciones, especialmente antes de publicar para usuarios reales.
4. En **APIs & Services → Library**, habilita **Gmail API** (necesario solo para enviar mensajes; no para el botón de login).

## 2. Client ID para "Continuar con Google" (login)

1. En **Google Auth Platform → Clients** (o Credenciales → Crear credenciales), crea un cliente **OAuth 2.0** de tipo **Web application** denominado `NoLimits Login`.
2. En **Authorized JavaScript origins**, agrega los orígenes **exactos**:
   - `http://localhost:3000`
   - `https://nolimitsbrand.cl` (solo cuando esté desplegado en ese dominio)
   - Si usas `www` o una URL real de Vercel, añádelos por separado.
3. El flujo **Google Identity Services renderButton con callback JS** de este proyecto no necesita URL de redirección de login.
4. Copia **Client ID** y guárdalo en `GOOGLE_CLIENT_ID` dentro de `backend/src/middleware/.env`.
5. El **Client ID es público**; el código lo expone mediante un endpoint de configuración. No se agrega `GOOGLE_CLIENT_ID` ni client secret al frontend.

## 3. Cliente OAuth de Gmail API (cuenta emisora)

> Gmail API envía mensajes desde una **cuenta Gmail controlada por la tienda**. Los clientes NO autorizan su propio buzón, solo reciben el correo.

1. Crea otro **Web application OAuth 2.0 client** denominado `NoLimits Gmail Emisor`.
2. Agrega a ese cliente esta **Authorized redirect URI**: `https://developers.google.com/oauthplayground`.
3. Configura en **Data Access / Scopes** el permiso mínimo de envío: `https://www.googleapis.com/auth/gmail.send`.
4. Abre https://developers.google.com/oauthplayground/ y pulsa el engranaje. Marca **Use your own OAuth credentials**; introduce el **Client ID y Client Secret del cliente Gmail**.
5. En el primer paso selecciona o escribe exactamente `https://www.googleapis.com/auth/gmail.send` y elige **Authorize APIs**.
6. Inicia sesión **con la cuenta Gmail que emitirá los mensajes** y concede el permiso. En modo Testing, agrégala como usuaria de prueba.
7. En el segundo paso pulsa **Exchange authorization code for tokens** y guarda **Refresh token** en `GMAIL_REFRESH_TOKEN`.
8. En `GMAIL_FROM_EMAIL` coloca exactamente el email de la cuenta que autorizó el scope (o un alias `send as` legítimo configurado).
9. **No copies** el access token ni el refresh token a GitHub, frontend, screenshots o chats.

**Importante:** una app OAuth `External` con estado `Testing` puede recibir refresh tokens que expiran en **7 días** si solicita `gmail.send`. Para funcionamiento duradero en producción, revisa el estado de publicación, la verificación aplicable y las políticas de Google. El envío también está sujeto a cuotas y políticas antispam. Las apps que solicitan Gmail scopes sensibles pueden necesitar verificación.

## 4. Variables de entorno (solo en backend)

Edita el archivo existente **`backend/src/middleware/.env`**:

```dotenv
# La sesión JWT, MongoDB, CORS, FRONTEND_URL y demás parámetros existentes NO se borran.
# Acceso Google (Client ID de la aplicación Web de login):
GOOGLE_CLIENT_ID=TU_CLIENT_ID_LOGIN.apps.googleusercontent.com

# Gmail API (segundo OAuth client, SOLO servidor):
GMAIL_CLIENT_ID=TU_CLIENT_ID_GMAIL.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=TU_CLIENT_SECRET_GMAIL
GMAIL_REFRESH_TOKEN=TU_REFRESH_TOKEN_EMISOR
GMAIL_FROM_EMAIL=correo.emisor@gmail.com

# Origen permitido por backend para validar la petición Google:
FRONTEND_URL=http://localhost:3000
# En producción, configura la URL real por HTTPS y las variables en tu hosting backend.
```

No necesitas crear `.env.local` ni poner credenciales de Google en `frontend/.env`. El frontend conserva su configuración actual `VITE_API_URL` tal como estaba en tu TXT.

## 5. Instalar dependencias y ejecutar

Desde `NotLimit_Proyecto/backend`:

```powershell
npm install
npm run build
npm run dev
```

La dependencia nueva ya aparece en `backend/package.json`: `google-auth-library`. La instalación también actualizará el lockfile del proyecto si existe.

En otra consola, desde `NotLimit_Proyecto/frontend`:

```powershell
npm run lint
npm run build
npm run dev
```

Comprueba que `http://localhost:5000/api/auth/google/config` contenga `enabled: true` y un `clientId` público. **Nunca debe incluir un `clientSecret`, `refreshToken` o token de sesión**.

## 6. Prueba de registro y correo

1. Crea una cuenta nueva con un correo Gmail real desde `http://localhost:3000/#/auth`.
2. Confirma que se agregó un documento nuevo en MongoDB `nolimits_db.users`, `role: registered`, con puntos de bienvenida según el backend.
3. Revisa la bandeja del usuario y también Spam/Promociones.
4. Revisa los logs backend en caso de fallo de Gmail; por diseño, la cuenta **sigue existiendo** aunque el mensaje no salga.
5. Reintentar registrar el mismo email debe devolver `409`, **no** generar otra cuenta ni otro correo.

## 7. Prueba de botón Google

1. En la pantalla inicial de `AuthView`, debe aparecer el botón **oficial** de Google.
2. Usa una cuenta incluida como test user si Google OAuth está en Testing.
3. Al aceptar, la app envía el **ID token firmado** a `/api/auth/google` y el backend entrega la cookie HttpOnly.
4. Un cliente nuevo se guarda en `users` sin contraseña y recibe correo de bienvenida si Gmail está configurado.
5. Si ya existe un cliente con el mismo email **verificado** de Google, conserva su ID, puntos y compras, vinculando `googleId` en MongoDB (solo si no estaba vinculado a otro Google ID).
6. Un administrador existente no puede iniciar sesión mediante este botón. Un token inventado o una solicitud de origen no autorizado debe ser rechazada.
7. Comprueba salida con **Cerrar sesión** y entrada posterior con Google: no debe generarse un usuario duplicado ni enviarse otra bienvenida.

## Diagnóstico rápido

| Síntoma | Revisa |
|---|---|
| No aparece botón Google | `GOOGLE_CLIENT_ID`, `/api/auth/google/config`, bloqueadores y `accounts.google.com/gsi/client` |
| `The given origin is not allowed` | Authorized JavaScript origins (puerto, protocolo, subdominio exactos) |
| 403 en `/api/auth/google` | `FRONTEND_URL`, middleware de origen, usuarios admin o cuenta desactivada |
| 401 Google | Client ID de login usado en el backend, token caducado, cookie/tiempo local |
| Gmail no entrega bienvenida | API habilitada, scopes, cliente OAuth Gmail, refresh token, cuenta emisora, bandeja de spam |
| `invalid_grant` a los 7 días | Google OAuth Testing: refresh token vencido. Reautoriza o regulariza publicación/verificación |
| Gmail devuelve 403 | Falta scope `gmail.send`, cuenta Gmail incorrecta o política de Google Workspace |

## Seguridad y alcance

- Nunca crear cuentas ni otorgar roles a partir de correo o `googleId` provistos sin firma; el backend exige ID token válido.
- Solo la cuenta emisora autoriza `gmail.send`; el login de clientes **NO solicita permisos Gmail**.
- No se guardan tokens de Google en localStorage o MongoDB de los clientes; se conserva la cookie HttpOnly existente.
- No se modifica el flujo Webpay, inventario, descuentos, cupones ni el esquema de pedidos.
- Las pruebas efectuadas al generar el ZIP fueron **sintácticas y de lógica aislada**, no de autorización real de Google, compilación completa, correo efectivamente recibido ni producción.
- Para producción conviene implantar cola/reintentos y registros de envíos sin información sensible. La Gmail API no garantiza entrega a bandeja principal y tiene límites.

### Documentación oficial

- Google ID token backend: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- Botón de Google Identity Services: https://developers.google.com/identity/gsi/web/guides/display-button
- OAuth Gmail server-side: https://developers.google.com/workspace/gmail/api/auth/web-server
- Gmail messages.send: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send
- OAuth testing refresh token: https://developers.google.com/identity/protocols/oauth2
