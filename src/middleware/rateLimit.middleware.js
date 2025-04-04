import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto (cambiado para pruebas)
    max: 50, // límite de 5 solicitudes por ventana por IP
    message: {
        status: 'error',
        message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente después de 1 minuto'
    },
    handler: (req, res, next, options) => {
        logger.warn({
            message: 'Rate limit exceeded',
            ip: req.ip,
            path: req.path,
            headers: req.headers
        });
        res.status().json(options.message);
    },
    standardHeaders: true, // Retorna `RateLimit-*` headers
    legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
    // Añadimos función keyGenerator personalizada
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }
});

// Añadimos un middleware de logging para debug
const debugRateLimit = (req, res, next) => {
    logger.info({
        message: 'Rate limit request',
        ip: req.ip,
        'x-forwarded-for': req.headers['x-forwarded-for'],
        remoteAddress: req.socket.remoteAddress
    });
    next();
};

export { limiter, debugRateLimit };
