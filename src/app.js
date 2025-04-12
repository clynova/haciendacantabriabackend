import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { validateEnv } from './config/env.validation.js';
import { errorHandler } from './middleware/error.middleware.js';
import { limiter } from './middleware/rateLimit.middleware.js';
import { getApiDocs } from './utils/apiDocs.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import csrf from 'csurf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validar variables de entorno
validateEnv();

const app = express();

// Configuración de confianza para proxy
app.set('trust proxy', true);

// Rate limiting - Aplicar solo a rutas /api
app.use('/api', limiter);

// Seguridad
app.use(helmet());

// Logging
app.use(morgan('combined'));

// Compresión
app.use(compression());

// Configuración de CORS
console.log('NODE_ENV:', process.env.NODE_ENV);
app.use(cors({
  origin: function(origin, callback) {
    // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
        'https://shop.cohesaspa.com',
        'https://haciendacantabriafrontend.vercel.app',
        'http://localhost:5173'
      ]
      : ['http://localhost:5173', 'http://localhost:4173'];
    
    // Verificar si el origen está permitido
    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.warn(`Origen no permitido: ${origin}`);
      // Si aun estás en desarrollo, puedes permitir todos los orígenes temporalmente
      callback(null, true); // Cambia a false para rechazar orígenes no permitidos en producción
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token', 'x-csrf-token'],
  credentials: true,
  maxAge: 86400 // 24 horas de caché para las respuestas preflight
}));

// Sanitización de datos
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Configuración de cookies y sesión
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'haciendacantabria-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Solo funciona con HTTPS
    httpOnly: true,
    sameSite: 'none', // Necesario para cross-origin
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 1 día en segundos
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_SECRET || 'haciendacantabria-secret'
    }
  })
}));

// Configuración de protección CSRF
export const csrfProtection = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none', // Necesario para cross-origin
  }
});

// Ruta para obtener el token CSRF
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Debe ser accesible desde el frontend
    sameSite: 'none'
  });
  res.json({ success: true });
});

// Ruta principal
app.get('/', async (req, res) => {
  try {
    const template = await fs.readFile(
      path.join(__dirname, 'views', 'home.html'),
      'utf8'
    );
    const html = template.replace('{{API_DOCS}}', getApiDocs());
    res.send(html);
  } catch (error) {
    console.error('Error al cargar la página:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

export default app;
