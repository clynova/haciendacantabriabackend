import express from 'express';
import { 
    addToCart, 
    removeFromCart, 
    clearCart, 
    removeProductFromCart, 
    loadCart,
    updateProductQuantity 
} from '../controllers/cartController.js';
import { checkAuth } from '../middleware/authMiddleware.js';

const cartRoutes = express.Router();

// Proteger todas las rutas
cartRoutes.use(checkAuth);

cartRoutes.get('/', loadCart);
cartRoutes.post('/add', addToCart);
cartRoutes.patch('/remove/:productId', removeFromCart);
cartRoutes.delete('/clear', clearCart);
cartRoutes.delete('/product/:productId', removeProductFromCart);
cartRoutes.put('/update-quantity/:productId', updateProductQuantity);

export { cartRoutes };
