import express from 'express';
import { getDashboardStats } from '../controllers/utilController.js';
import { checkAuth, checkRole  } from '../middleware/authMiddleware.js';

const utilRoutes = express.Router();

utilRoutes.get('/getdashboardstats', checkAuth, checkRole('admin'), getDashboardStats);

export { utilRoutes };
