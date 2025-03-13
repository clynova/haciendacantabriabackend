import express from 'express';
import { checkAuth, checkRole } from '../middleware/authMiddleware.js';
import {
    initiatePayment,
    processWebpayReturn,
    processMercadoPagoWebhook,
    getPaymentStatus,
    updateReturnUrl
} from '../controllers/paymentProcessingController.js';
import { param } from 'express-validator';

const paymentProcessingRoutes = express.Router();

// Validadores
const validateOrderId = [
    param('orderId')
        .isMongoId().withMessage('ID de orden no válido')
];


// Ruta para actualizar la URL de retorno (solo administradores)
paymentProcessingRoutes.post('/update-return-url', checkAuth, checkRole('admin'), updateReturnUrl);

// Ruta para iniciar proceso de pago
paymentProcessingRoutes.post('/initiate/:orderId', checkAuth, validateOrderId, initiatePayment);

// Ruta para obtener estado de pago
paymentProcessingRoutes.get('/status/:orderId', checkAuth, validateOrderId, getPaymentStatus);

// Rutas para WebPay - aceptar tanto GET como POST
paymentProcessingRoutes.route('/webpay/return')
    .get(processWebpayReturn)
    .post(processWebpayReturn);

// Rutas para MercadoPago
paymentProcessingRoutes.post('/mercadopago/webhook', processMercadoPagoWebhook);

export { paymentProcessingRoutes }; 