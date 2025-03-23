import express from 'express';
import { 
    createQuotation, 
    getQuotations, 
    getQuotation, 
    updateQuotation, 
    deleteQuotation, 
    getUserQuotations, 
    getAllQuotations 
} from '../controllers/quotationController.js';
import { checkAuth, checkRole } from '../middleware/authMiddleware.js';
import { validateCreateQuotation } from '../middleware/validators/quotationValidators.js';

const quotationRoutes = express.Router();

// Rutas sin parámetros dinámicos primero
quotationRoutes.post('/', checkAuth, validateCreateQuotation, createQuotation);
quotationRoutes.get('/user', checkAuth, getUserQuotations);
quotationRoutes.get('/all', checkAuth, checkRole('admin'), getAllQuotations);

// Rutas con parámetros después
quotationRoutes.get('/:quotationId', checkAuth, getQuotation);
quotationRoutes.put('/:_id', checkAuth, checkRole('admin'), updateQuotation);
quotationRoutes.delete('/:_id', checkAuth, checkRole('admin'), deleteQuotation);

export { quotationRoutes };