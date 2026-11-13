# HabitaBogotá — Plataforma Inmobiliaria Full-Stack (Bogotá · COP)

Aplicación inmobiliaria full-stack con transparencia de costos (**Arriendo + Administración = Costo Total**), base de datos **PostgreSQL en Neon**, API REST con **Node.js + Express** y asistente de búsqueda inteligente (**Habi**) con **Groq Tool Calling**.

---

## Arquitectura del Proyecto

```text
├── server.js                  # Servidor Express (API REST + archivos estáticos /public)
├── package.json               # Node.js >=20, scripts start/dev/build
├── .env.example               # Plantilla de variables de entorno (sin secretos)
├── .gitignore                 # Excluye .env y node_modules
├── render.yaml                # Configuración de despliegue en Render
├── db/
│   ├── schema.sql             # Tablas, restricciones CHECK, columna calculada, vista e índices
│   └── seed.sql               # 12 inmuebles realistas en Bogotá con imágenes y puntos de interés
├── src/
│   ├── db.js                  # Pool de conexión pg con SSL para Neon
│   ├── middleware/
│   │   ├── validate.js        # Validación Zod, saneamiento de texto y control X-Sesion-Id
│   │   ├── rateLimit.js       # Límites de tasa por IP y por sesión
│   │   └── errorHandler.js    # Manejo centralizado de errores sin filtrar detalles
│   ├── routes/
│   │   ├── inmuebles.js       # GET /api/inmuebles, GET /api/inmuebles/:id
│   │   ├── guardados.js       # GET/POST/DELETE /api/guardados
│   │   ├── comparador.js      # GET/POST/DELETE /api/comparador (máx. 3 por sesión)
│   │   ├── alertas.js         # POST /api/alertas
│   │   ├── soporte.js         # POST /api/soporte
│   │   └── chat.js            # POST /api/chat (Groq + historial en chat_mensajes)
│   └── services/
│       ├── inmueblesQuery.js  # Consultas SQL parametrizadas compartidas
│       ├── chatTools.js       # Herramientas del asistente y puntaje transparente
│       └── groq.js            # Cliente Groq SDK y bucle de herramientas (máx. 3 turnos)
└── public/                    # Frontend editorial HTML5 / CSS3 / JS vanilla
    ├── index.html
    ├── inmueble.html
    ├── guardados.html
    ├── comparador.html
    ├── ayuda.html
    ├── assets/icons.svg
    ├── css/
    └── js/
```

---

## 1. Crear base de datos en Neon Postgres y cargar tablas

1. Crea una cuenta gratuita en [console.neon.tech](https://console.neon.tech/) y crea un nuevo proyecto (por ejemplo, `habitabogota`).
2. Copia la cadena de conexión (**Connection String**) que termina en `?sslmode=require`.
3. Ejecuta primero `db/schema.sql` y luego `db/seed.sql`:
   - **Desde el SQL Editor de Neon Console:** pega el contenido de `db/schema.sql` y haz clic en **Run**; luego pega `db/seed.sql` y haz clic en **Run**.
   - **O desde terminal con `psql`:**
     ```bash
     psql "TU_DATABASE_URL_CON_SSLMODE_REQUIRE" -f db/schema.sql
     psql "TU_DATABASE_URL_CON_SSLMODE_REQUIRE" -f db/seed.sql
     ```

---

## 2. Obtener API Key de Groq

1. Ingresa a [console.groq.com](https://console.groq.com/) e inicia sesión.
2. Ve a **API Keys** → **Create API Key** y copia la clave (`gsk_...`).
3. Elige un modelo compatible con **tool calling / function calling** (por ejemplo: `llama-3.3-70b-versatile`) para configurarlo en la variable `GROQ_MODEL`.

---

## 3. Instalación y ejecución local

1. **Instala dependencias (Node.js 20+):**
   ```bash
   npm install
   ```
2. **Crea el archivo `.env` a partir de `.env.example`:**
   ```bash
   cp .env.example .env
   ```
3. **Edita `.env` con tus credenciales reales:**
   ```env
   PORT=3000
   NODE_ENV=development
   ALLOWED_ORIGIN=http://localhost:3000
   DATABASE_URL=postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   GROQ_API_KEY=gsk_tu_clave_real
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
4. **Inicia el servidor:**
   ```bash
   npm start
   ```
5. Abre **http://localhost:3000** en tu navegador.
   - Puedes verificar la conexión a Neon en **http://localhost:3000/api/salud**.

---

## 4. Despliegue en Render o Vercel

### Opción A: Render (Web Service Node.js)
1. Sube el repositorio a GitHub/GitLab (asegúrate de que `.env` esté ignorado por `.gitignore`).
2. En [dashboard.render.com](https://dashboard.render.com/), haz clic en **New + → Web Service** y conecta el repositorio.
3. Configura:
   - **Runtime:** `Node`
   - **Build Command:** `npm install --legacy-peer-deps && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/salud`
4. En **Environment Variables**, agrega:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = tu cadena de conexión de Neon (`?sslmode=require`)
   - `GROQ_API_KEY` = tu clave de Groq
   - `GROQ_MODEL` = `llama-3.3-70b-versatile`
   - `ALLOWED_ORIGIN` = `https://tu-app.onrender.com`
5. Haz clic en **Create Web Service**.

### Opción B: Vercel (Node.js Express)
1. Crea un archivo `vercel.json` en la raíz si despliegas en Vercel, o conecta directamente el proyecto Node/Express desde [vercel.com/new](https://vercel.com/new):
   ```json
   {
     "version": 2,
     "rewrites": [{ "source": "/(.*)", "destination": "/server.js" }]
   }
   ```
2. En **Project Settings → Environment Variables**, agrega las mismas variables (`DATABASE_URL`, `GROQ_API_KEY`, `GROQ_MODEL`, `ALLOWED_ORIGIN` con la URL `https://tu-proyecto.vercel.app`) y despliega.
