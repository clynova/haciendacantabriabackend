import express from 'express';
import { 
    getAllTags, 
    getProductTags, 
    addTagsToProduct, 
    updateProductTags, 
    removeTagsFromProduct, 
    findProductsByTags,
    findAllProductsByTags,
    renameTag, 
    deleteTag 
} from '../controllers/tagController.js';
import { checkAuth, checkTokenBlacklist, checkRole } from '../middleware/authMiddleware.js';
import { validateTagOperations } from '../middleware/validators/tagValidators.js';

const tagRoutes = express.Router();

// Rutas públicas
tagRoutes.get('/', getAllTags);
tagRoutes.get('/products', findProductsByTags);
tagRoutes.get('/products/all', findAllProductsByTags);

// Rutas para gestión de etiquetas de productos específicos
tagRoutes.get('/product/:productId', getProductTags);
tagRoutes.post('/product/:productId', checkAuth, checkTokenBlacklist, checkRole('admin'), validateTagOperations, addTagsToProduct);
tagRoutes.put('/product/:productId', checkAuth, checkTokenBlacklist, checkRole('admin'), validateTagOperations, updateProductTags);
tagRoutes.delete('/product/:productId', checkAuth, checkTokenBlacklist, checkRole('admin'), validateTagOperations, removeTagsFromProduct);

// Rutas para gestión global de etiquetas
tagRoutes.put('/rename', checkAuth, checkTokenBlacklist, checkRole('admin'), renameTag);
tagRoutes.delete('/:tag', checkAuth, checkTokenBlacklist, checkRole('admin'), deleteTag);

export { tagRoutes };