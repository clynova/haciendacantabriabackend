import express from 'express';
import { getDashboardStats, getTopTags, getTotalSales, getQuotationStats, getOrderStats } from '../controllers/utilController.js';
import { checkAuth } from '../middleware/authMiddleware.js';
import { handleContactForm } from '../controllers/contactController.js';

const utilRoutes = express.Router();

utilRoutes.get('/getdashboardstats', checkAuth, getDashboardStats);
utilRoutes.get('/top-tags', checkAuth, getTopTags);
utilRoutes.get('/total-sales', checkAuth, getTotalSales);
utilRoutes.get('/quotation-stats', checkAuth, getQuotationStats);
utilRoutes.get('/order-stats', checkAuth, getOrderStats);

utilRoutes.post('/contact', handleContactForm);

export { utilRoutes };
