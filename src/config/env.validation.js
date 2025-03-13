import { cleanEnv, str, port, url } from 'envalid';
import logger from '../utils/logger.js';

export const validateEnv = () => {
    try {
        cleanEnv(process.env, {
            NODE_ENV: str({
                choices: ['development', 'production', 'test']
            }),
            PORT: port({ default: 4000 }),
            MONGODB_URI: url(),
            JWT_SECRET: str(),
            JWT_EXPIRES_IN: str({ default: '90d' }),
            CORS_ORIGIN: str(),
            // Añade aquí otras variables de entorno que necesites validar
        });
        
        logger.info('Variables de entorno validadas correctamente');
    } catch (error) {
        logger.error('Error en la validación de variables de entorno:', error);
        process.exit(1);
    }
};
