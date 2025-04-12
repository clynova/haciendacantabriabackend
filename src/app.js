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
    if (!origin) return callback(null, true);
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://shop.cohesaspa.com', 'https://haciendacantabriafrontend.vercel.app']
      : ['http://localhost:5173', 'http://localhost:4173'];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origen no permitido: ${origin}`);
      callback(new Error('Origen no permitido por CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN'],
  credentials: true,
  maxAge: 86400
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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    // Usar capitalización correcta para sameSite
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,
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
    // Usar capitalización correcta para sameSite
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
  }
});

// Ruta para obtener el token CSRF
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  const csrfToken = req.csrfToken();
  console.log('Generando token CSRF:', csrfToken);
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.cookie('XSRF-TOKEN', csrfToken, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // Debe ser false para que el cliente lo lea
    // Usar capitalización correcta para sameSite
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
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
  console.error('Error capturado:', err);
  // Asegúrate de que el middleware CSRF maneje sus propios errores específicos
  if (err.code === 'EBADCSRFTOKEN') {
    console.error('CSRF Token Error:', err);
    res.status(403).json({ message: 'Invalid CSRF token' });
  } else {
    errorHandler(err, req, res, next);
  }
});

export default app;