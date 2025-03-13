import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist } from '../controllers/wishlistController.js';
import { checkAuth} from '../middleware/authMiddleware.js';

const wishlistRoutes = express.Router();

wishlistRoutes.get('/', checkAuth, getWishlist);

wishlistRoutes.post('/add', checkAuth, addToWishlist);

wishlistRoutes.delete('/remove/:productId', checkAuth, removeFromWishlist);

wishlistRoutes.delete('/clear', checkAuth, clearWishlist);

export { wishlistRoutes };
