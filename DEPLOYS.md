# Guía de Despliegue en la Nube: Bizki Quality Suite

Esta guía explica paso a paso cómo desplegar la base de datos, el backend y el frontend de **Bizki Quality Suite** en la nube de manera gratuita o económica.

---

## 📋 Arquitectura de Despliegue Sugerida

1. **Base de Datos**: PostgreSQL en **Supabase** o **Neon.tech** (Nivel gratuito).
2. **Backend (API)**: FastAPI en **Render.com** (Web Service gratuito o de pago).
3. **Frontend**: React (Vite) en **Vercel** o **Netlify** (Hosting estático gratuito).

---

## 🛠️ Paso 1: Configurar la Base de Datos PostgreSQL

Recomendamos **Supabase** o **Neon** por su facilidad y estabilidad.

1. Regístrate en [Supabase](https://supabase.com/) o [Neon](https://neon.tech/).
2. Crea un nuevo proyecto llamado `bizki-quality`.
3. Ve a la sección de **Database Settings** (Configuración de Base de Datos) y copia la **Connection String** (URI de conexión).
   * La URI tendrá un formato similar a:
     `postgresql://postgres:[TU_CONTRASEÑA]@db.xxxxxx.supabase.co:5432/postgres` o `postgres://...`
4. Guarda esta cadena de conexión; la necesitarás para configurar el backend.

---

## 🚀 Paso 2: Desplegar el Backend (FastAPI) en Render

[Render](https://render.com/) es una plataforma excelente para desplegar aplicaciones de Python y FastAPI de forma sencilla.

### 2.1. Subir tu proyecto a GitHub
Si aún no lo has hecho, inicializa un repositorio de git y sube tu código a GitHub:
```bash
git init
git add .
git commit -m "Preparar despliegue en la nube"
# Conecta y sube a tu repositorio de GitHub
git remote add origin <TU_URL_DE_GITHUB>
git branch -M main
git push -u origin main
```

### 2.2. Crear el Servicio Web en Render
1. Regístrate o inicia sesión en [Render](https://render.com/).
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio de `BizkiQualitySuite`.
4. Configura los siguientes campos:
   * **Name**: `bizki-quality-backend`
   * **Root Directory**: `backend` (Muy importante: especifica `backend` porque el backend está en esa subcarpeta).
   * **Language**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Selecciona el plan gratuito (**Free**).

### 2.3. Agregar Variables de Entorno en Render
En la pestaña **Environment** del servicio web en Render, agrega las siguientes variables de entorno:

| Clave | Valor | Descripción |
| :--- | :--- | :--- |
| `DATABASE_URL` | *La URL que copiaste de Supabase/Neon* | Conexión a la base de datos |
| `APP_NAME` | `Bizki Quality Suite` | Nombre de la aplicación |
| `APP_VERSION` | `0.1.0` | Versión |
| `SECRET_KEY` | *Genera una clave aleatoria y segura* | Ej: `ClaveSuperSecretaParaBizkiEnProduccion2026` |
| `ALGORITHM` | `HS256` | Algoritmo de encriptación |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Tiempo de expiración del token |

6. Haz clic en **Save Changes** y Render comenzará a construir y desplegar tu backend.
7. Una vez completado, copia la URL que te da Render (por ejemplo: `https://bizki-quality-backend.onrender.com`).

---

## 💻 Paso 3: Desplegar el Frontend (React / Vite) en Vercel o Netlify

Recomendamos **Vercel** o **Netlify** ya que ofrecen despliegues automáticos rápidos y gratuitos para sitios web estáticos creados con Vite.

### Despliegue en Vercel:
1. Regístrate en [Vercel](https://vercel.com/) usando tu cuenta de GitHub.
2. Haz clic en **Add New** > **Project**.
3. Importa el repositorio de `BizkiQualitySuite`.
4. Configura el proyecto:
   * **Root Directory**: `frontend` (Muy importante: especifica `frontend` porque el frontend está en esa subcarpeta).
   * **Framework Preset**: `Vite` (Vercel lo detectará automáticamente).
   * **Build and Output Settings**: Déjalo por defecto (construirá usando `npm run build` y la carpeta de salida será `dist`).
5. **Environment Variables**:
   * Agrega la siguiente variable de entorno para conectar el Frontend con el Backend en la nube:
     * **Key**: `VITE_API_URL`
     * **Value**: *La URL de tu backend en Render* (ej. `https://bizki-quality-backend.onrender.com`)
6. Haz clic en **Deploy**.

¡Listo! Vercel te entregará una URL pública (ej: `https://bizki-quality-suite.vercel.app`) para que tus usuarios puedan acceder a la aplicación desde cualquier parte del mundo.

---

## 🔐 Configuración de Seguridad y CORS (Opcional)

Si necesitas restringir el acceso a tu API solo desde el frontend desplegado:
1. Abre [backend/app/main.py](file:///c:/G%C3%A9nesisProyecto/BizkiQualitySuite/backend/app/main.py).
2. Puedes configurar la lista de orígenes permitidos reemplazando `allow_origins=["*"]` por tu URL de frontend en Vercel (ej: `allow_origins=["https://bizki-quality-suite.vercel.app"]`).

---

## 🔄 Actualizaciones Futuras
Cada vez que hagas un cambio en tu código y hagas un `git push` a tu repositorio de GitHub, tanto **Render** como **Vercel** reconstruirán e implementarán los cambios automáticamente de forma transparente.
