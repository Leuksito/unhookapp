# UnhookApp

> Limpia tu bandeja de Gmail — date de baja, envía a la papelera y filtra los correosno deseados de forma masiva.

UnhookApp se conecta a tu cuenta de Gmail mediante OAuth 2.0, escanea tu bandeja en
busca de newsletters, promociones y notificaciones sociales, y te permite eliminarlos con
un solo clic. Incluye un **Modo Zen** controlado por teclado (← / →) para revisar remitentes
a velocidad.

## Características

- **Integración Gmail vía OAuth 2.0** — escaneo de solo lectura, luego cortar/deshacer con la API de Gmail
- **Clasificación inteligente de remitentes** — categoriza como newsletter, promoción, social o transaccional
- **Cortar** — envía a la papelera todos los correos de un remitente y crea un filtro de Gmail que auto-papeleriza los futuros
- **Deshacer** — restaura los correos y elimina el filtro auto-papelera
- **Posponer (snooze)** — oculta un remitente durante 30 días
- **Cortar todo** — procesa en lote todos los remitentes visibles
- **Modo Zen** — sesión solo-teclado (← / →) para cortar o mantener remitentes rápidamente
- **Historial** — registro completo de cortes pasados con opción de deshacer
- **Puntuación de salud de la bandeja** — indicador visual de progreso
- **Rachas** — gamificación con rachas diarias
- **Animación de celebración** — confeti al alcanzar hitos
- **i18n** — 7 idiomas: inglés, español, francés, portugués, alemán, italiano, japonés
- **Modo demo** — prueba la app sin conectar una cuenta real de Gmail
- **Detector de suscripciones pagas** — detecta remitentes de servicios que ya pagas (Netflix, Spotify, etc.) y muestra tu gasto mensual / anual estimado

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite 8, React Router 7, Lucide icons |
| Backend | Node.js, Express 5 |
| Base de datos | SQLite (better-sqlite3) |
| Auth | Google OAuth 2.0 (googleapis + google-auth-library) |
| Seguridad | Helmet, express-rate-limit, express-session, protección CSRF |
| Tests | `node:test` (sin dependencias externas) |

## Requisitos previos

- [Node.js](https://nodejs.org/) 18+ y npm
- Un proyecto de Google Cloud con la **Gmail API** habilitada

## Puesta en marcha (desarrollo local)

### 1. Conseguir credenciales de Google

1. Entra en [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo (o selecciona uno existente)
3. Habilita **Gmail API** (APIs & Services > Library)
4. Ve a **APIs & Services > Credentials**
5. **+ CREATE CREDENTIALS > OAuth 2.0 Client ID**
6. Tipo: **Web application**
7. Añade este redirect URI: `http://localhost:3001/api/auth/callback`
8. Copia el **Client ID** y el **Client Secret**

### 2. Configurar variables de entorno

Copia el ejemplo y rellena tus credenciales desde la raíz del proyecto:

```bash
cp server/.env.example server/.env
```

Edita `server/.env`:

```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/callback
SESSION_SECRET=elige_un_secreto_aleatorio
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### 3. Instalar dependencias y arrancar

```bash
# Servidor (puerto 3001)
cd server && npm install && npm start

# Cliente (puerto 5173)
cd client && npm install && npm run dev
```

Abre **[http://localhost:5173](http://localhost:5173)**.

### Windows — setup con un clic

```powershell
.\setup.ps1
```

Verifica credenciales, instala dependencias y lanza ambas partes en ventanas nuevas.

## Despliegue

UnhookApp se despliega como un único contenedor Docker que sirve el cliente (build estático
de Vite) y el backend (Express) desde el mismo puerto.

### Opción A — Docker Compose (recomendado)

1. Crea el archivo `.env` en la raíz a partir de `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Rellena al menos `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` y
   `FRONTEND_URL` con la URL pública desde la que accederán los usuarios.

2. En Google Cloud Console añade como redirect URI:
   `https://TU_DOMINIO/api/auth/callback`

3. Levanta el servicio:

   ```bash
   docker compose up -d --build
   ```

La app responde en el puerto configurado (`3001` por defecto). La base SQLite se persiste
en un volumen llamado `unhookapp-data`.

### Opción B — Docker manual

```bash
docker build -t unhookapp .
docker run -d \
  -p 3001:3001 \
  -e GOOGLE_CLIENT_ID=... \
  -e GOOGLE_CLIENT_SECRET=... \
  -e SESSION_SECRET=... \
  -e FRONTEND_URL=https://TU_DOMINIO \
  -e GOOGLE_REDIRECT_URI=https://TU_DOMINIO/api/auth/callback \
  -v unhookapp-data:/app/server/data \
  --name unhookapp unhookapp
```

### Opción C — Plataformas PaaS (Render, Railway, Fly.io)

Push a GitHub y despliega como un web service. La build es `docker build .` y el start
command es `node index.js`. El `Dockerfile` ya está listo. Configura las mismas variables
de entorno. El volumen persistente no es necesario para probar. Si la plataforma es
serverless (Vercel, Netlify Functions) considera migrar SQLite a Postgres, ya que
el filesystem efímero borraría la base entre invocaciones.

### Notas importantes para producción

- `FRONTEND_URL` debe ser la URL pública exacta desde la que los usuarios acceden
  (sin slash final). El validador CSRF del servidor la usa para verificar `Origin`.
- `SESSION_SECRET` debe ser **el mismo** entre reinicios o todas las sesiones se pierden.
- Si quieres clasificación con Gemini, rellena `GEMINI_API_KEY`. Sin ella, esa función
  simplemente devuelve todo a "other".
- El servidor escucha en `0.0.0.0:3001`. Detrás de un proxy, ya tiene
  `app.set('trust proxy', 1)` activado para que `express-rate-limit` funcione bien.

## Tests

```bash
cd server
npm test            # parser, classifier, crypto
```

Los tests usan el runner integrado de Node (`node:test`) — sin dependencias extra.

## Uso

1. Abre la app y pulsa **Conectar Gmail** para autenticarte
2. Pulsa **Escanear bandeja** — UnhookApp analiza tus últimos correos
3. Revisa los remitentes detectados, ordenados por frecuencia
4. **Corta** los no deseados, o usa **Cortar todo** para limpieza masiva
5. **Deshacer** invierte un corte cuando quieras
6. Prueba **Modo Zen** (ícono teclado) para revisión a velocidad
7. Revisa tu **Historial** para ver todo lo cortado

O usa **Modo Demo** para explorar la app sin una cuenta real.

## Estructura del proyecto

```
UnhookApp/
├── client/                  # SPA React (Vite)
│   └── src/
│       ├── components/      # Componentes React
│       ├── i18n/           # Traducciones (7 idiomas)
│       └── utils/           # Cliente API
├── server/                  # API REST Express
│   ├── db/                  # Inicialización SQLite
│   ├── routes/              # Rutas API (auth, emails)
│   └── services/            # Cliente Gmail + parser + tests
├── .github/workflows/       # CI de GitHub Actions
├── Dockerfile               # Imagen multi-stage producción
├── docker-compose.yml       # Orquestación local / VPS
├── .env.example             # Template de variables de entorno
├── setup.ps1                # Setup Windows
└── README.md
```

## Seguridad

- Los tokens OAuth se guardan **cifrados** en SQLite (AES-256-GCM), nunca en plano
- La app pide el scope mínimo de Gmail: `gmail.readonly`, `gmail.modify`, `gmail.labels`
- Rate limiting y protección CSRF activados en todos los endpoints `/api`
- No se almacena contenido de correos — solo metadatos de unsub y logs de acciones

## Licencia

[Apache 2.0](LICENSE) — Copyright 2024 Leuksito