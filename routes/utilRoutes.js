import express from 'express';
import { getDashboardStats, getTopTags, getTotalSales, getQuotationStats, getOrderStats, getTopProducts } from '../controllers/utilController.js';
import { checkAuth } from '../middleware/authMiddleware.js';
import { handleContactForm } from '../controllers/contactController.js';
import { enviarEmailConfirmacionOrden } from '../controllers/emailController.js';

const utilRoutes = express.Router();

utilRoutes.get('/getdashboardstats', checkAuth, getDashboardStats);
utilRoutes.get('/top-tags', checkAuth, getTopTags);
utilRoutes.get('/total-sales', checkAuth, getTotalSales);
utilRoutes.get('/quotation-stats', checkAuth, getQuotationStats);
utilRoutes.get('/order-stats', checkAuth, getOrderStats);
utilRoutes.get('/top-products', getTopProducts); // Nueva ruta

utilRoutes.post('/contact', handleContactForm);
utilRoutes.get('/send-emailOrder/:orderId', checkAuth, enviarEmailConfirmacionOrden);

export { utilRoutes };
