import express from 'express';
import {
    getRegions,
    getRegionById,
    createRegion,
    updateRegion,
    deleteRegion
} from '../controllers/regionController.js';
import { checkAuth } from '../middleware/authMiddleware.js';
import { 
    validateRegionCreation, 
    validateRegionUpdate, 
    validateRegionId 
} from '../middleware/validators/regionValidators.js';

const regionRoutes = express.Router();

// Rutas públicas
regionRoutes.get('/', getRegions);
regionRoutes.get('/:id', validateRegionId, getRegionById);

// Rutas protegidas (solo admin)
regionRoutes.post('/', checkAuth, validateRegionCreation, createRegion);
regionRoutes.put('/:id', checkAuth, validateRegionUpdate, updateRegion);
regionRoutes.delete('/:id', checkAuth, validateRegionId, deleteRegion);

export { regionRoutes };