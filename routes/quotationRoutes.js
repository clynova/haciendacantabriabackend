import express from 'express';
import { createQuotation, getQuotations, getQuotation, updateQuotation, deleteQuotation, getUserQuotations, getAllQuotations } from '../controllers/quotationController.js';
import { checkAuth, checkRole } from '../middleware/authMiddleware.js';
import { validateCreateQuotation } from '../middleware/validators/quotationValidators.js';

const quotationRoutes = express.Router();

// Rutas protegidas que requieren autenticación
quotationRoutes.use(checkAuth);

// Rutas para usuarios normales
quotationRoutes.post('/', validateCreateQuotation, createQuotation);
quotationRoutes.get('/user', getUserQuotations); // Nueva ruta para obtener cotizaciones del usuario

// Rutas que requieren rol de administrador
quotationRoutes.get('/all', checkRole('admin'), getAllQuotations); // Nueva ruta para obtener todas las cotizaciones
quotationRoutes.get('/:quotationId', checkRole('admin'), getQuotation);
quotationRoutes.put('/:_id', checkRole('admin'), updateQuotation);
quotationRoutes.delete('/:_id', checkRole('admin'), deleteQuotation);

export { quotationRoutes };