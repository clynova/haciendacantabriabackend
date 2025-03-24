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

// Rutas para usuarios normales
orderRoutes.post('/', validateOrder, createOrder);
orderRoutes.get('/user', getUserOrders);
orderRoutes.get('/user/:orderId', validateOrderId, getOrder);

// Ruta para crear orden desde cotización
orderRoutes.post('/from-quotation', validateCreateOrderFromQuotation, createOrderFromQuotation);

// Rutas exclusivas para administradores
orderRoutes.get('/all', checkRole('admin'), getOrders);
orderRoutes.get('/:orderId', checkRole('admin'), validateOrderId, getOrder);
orderRoutes.put('/:orderId', checkRole('admin'), validateOrderId, updateOrder);
orderRoutes.delete('/:orderId', checkRole('admin'), validateOrderId, deleteOrder);

export { orderRoutes };
