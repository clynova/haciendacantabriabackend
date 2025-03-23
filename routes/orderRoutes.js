import express from 'express';
import {
    createOrder,
    getUserOrders,
    getOrders,
    getOrder,
    updateOrder,
    deleteOrder,
    createOrderFromQuotation
} from '../controllers/orderController.js';
import { checkAuth, checkRole } from '../middleware/authMiddleware.js';
import { validateOrder, validateOrderId, validateCreateOrderFromQuotation } from '../middleware/validators/orderValidators.js';

const orderRoutes = express.Router();

// Rutas protegidas que requieren autenticación
orderRoutes.use(checkAuth);

// Ruta para crear orden desde cotización
orderRoutes.post('/from-quotation', validateCreateOrderFromQuotation, createOrderFromQuotation);

// Rutas existentes
orderRoutes.post('/', validateOrder, createOrder);
orderRoutes.get('/user', getUserOrders);
orderRoutes.get('/', checkRole('admin'), getOrders);
orderRoutes.get('/:orderId', validateOrderId, getOrder);
orderRoutes.put('/:id', checkRole('admin'), updateOrder);
orderRoutes.delete('/:id', checkRole('admin'), deleteOrder);

export { orderRoutes };
