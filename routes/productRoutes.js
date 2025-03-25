import express from 'express';
import { checkAuth, checkRole } from '../middleware/authMiddleware.js';
import { validateProductRegistration, validateProductModificar, validateProductID } from '../middleware/validators/productValidators.js';
import {
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    findProducts,
    getActiveProducts,
    getAllProductsAdmin,
    updateProductStatus
} from '../controllers/productController.js';

const router = express.Router();

// Rutas públicas
router.get('/active', getActiveProducts);
router.get('/search', findProducts);
router.get('/:_id', validateProductID, getProduct);

// Rutas protegidas que requieren autenticación
router.use(checkAuth);

// Rutas que requieren rol de administrador
router.get('/admin/all', checkRole('admin'), getAllProductsAdmin);
router.post('/', checkRole('admin'), validateProductRegistration, createProduct);
router.put('/:_id', checkRole('admin'), validateProductModificar, updateProduct);
router.delete('/:_id', checkRole('admin'), validateProductID, deleteProduct);
router.put('/:_id/status', checkRole('admin'), updateProductStatus);

export { router as productRoutes };
