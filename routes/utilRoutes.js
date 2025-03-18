import express from 'express';
import { getDashboardStats, getTopTags, getTotalSales } from '../controllers/utilController.js';
import { checkAuth, checkRole  } from '../middleware/authMiddleware.js';

const utilRoutes = express.Router();

utilRoutes.get('/getdashboardstats', checkAuth, checkRole('admin'), getDashboardStats);
utilRoutes.get('/top-tags', checkAuth, checkRole('admin'), getTopTags);
utilRoutes.get('/total-sales', checkAuth, checkRole('admin'), getTotalSales);

export { utilRoutes };
