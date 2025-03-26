import express from 'express';
import {
    getRegions,
    getRegionById,
    createRegion,
    updateRegion,
    deleteRegion,
    updateRegionStatus,
    getRegionsAll
} from '../controllers/regionController.js';
import { checkAuth, checkRole } from '../middleware/authMiddleware.js';
import {
    validateRegionCreation,
    validateRegionUpdate,
    validateRegionId
} from '../middleware/validators/regionValidators.js';

const regionRoutes = express.Router();

// Rutas públicas
regionRoutes.get('/', getRegions);
regionRoutes.get('/all', getRegionsAll);
regionRoutes.get('/:id', validateRegionId, getRegionById);

// Rutas protegidas (solo admin)
regionRoutes.post('/', checkAuth, checkRole('admin'), validateRegionCreation, createRegion);
regionRoutes.put('/:id', checkAuth, checkRole('admin'), validateRegionUpdate, updateRegion);
regionRoutes.delete('/:id', checkAuth, checkRole('admin'), validateRegionId, deleteRegion);
regionRoutes.put('/:id/status', checkAuth, checkRole('admin'), updateRegionStatus);

export { regionRoutes };