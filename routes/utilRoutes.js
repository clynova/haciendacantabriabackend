import express from 'express';
import { getDashboardStats, getTopTags } from '../controllers/utilController.js';
import { checkAuth, checkRole  } from '../middleware/authMiddleware.js';

const utilRoutes = express.Router();

utilRoutes.get('/getdashboardstats', checkAuth, checkRole('admin'), getDashboardStats);
utilRoutes.get('/top-tags', getTopTags);

export { utilRoutes };
