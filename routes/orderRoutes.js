import express from 'express';
import { createOrder, getUserOrders, getOrder } from '../controllers/orderController.js';
import { checkAuth, checkTokenBlacklist } from '../middleware/authMiddleware.js';
import { validateOrder, validateOrderId } from '../middleware/validators/orderValidators.js';

const orderRoutes = express.Router();

orderRoutes.post('/', checkAuth, checkTokenBlacklist, validateOrder, createOrder);
orderRoutes.get('/', checkAuth, checkTokenBlacklist, getUserOrders);
orderRoutes.get('/:orderId', checkAuth, checkTokenBlacklist, validateOrderId, getOrder);

export { orderRoutes };
