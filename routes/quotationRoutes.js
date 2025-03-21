import express from 'express';
import { createQuotation, getQuotations, getQuotation, updateQuotation, deleteQuotation } from '../controllers/quotationController.js';
import { checkAuth } from '../middleware/authMiddleware.js';
import { validateCreateQuotation } from '../middleware/validators/quotationValidators.js';

const quotationRoutes = express.Router();

// Rutas protegidas que requieren autenticación
quotationRoutes.use(checkAuth);

// Rutas para cotizaciones
quotationRoutes.post('/', validateCreateQuotation, createQuotation);
quotationRoutes.get('/', getQuotations);
quotationRoutes.get('/:quotationId', getQuotation);
quotationRoutes.put('/:id', updateQuotation);
quotationRoutes.delete('/:id', deleteQuotation);

export { quotationRoutes };