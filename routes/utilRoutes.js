import express from 'express';
import { getDashboardStats, getTopTags, getTotalSales } from '../controllers/utilController.js';
import { checkAuth, checkRole  } from '../middleware/authMiddleware.js';
import { handleContactForm } from '../controllers/contactController.js';

const utilRoutes = express.Router();

utilRoutes.get('/getdashboardstats', checkAuth, checkRole('admin'), getDashboardStats);
utilRoutes.get('/top-tags', checkAuth, checkRole('admin'), getTopTags);
utilRoutes.get('/total-sales', checkAuth, checkRole('admin'), getTotalSales);

// Ruta para el formulario de contacto
utilRoutes.post('/contact', handleContactForm);

export { utilRoutes };
