import express from 'express';
import {
    getReviews,
    createReview,
    updateReview,
    deleteReview,
    getReviewById
} from '../controllers/reviewController.js';
import {
    validateReviewRegistration,
    validateReviewModificar,
    validateReviewID
} from '../middleware/validators/reviewValidators.js';
import { checkAuth, checkOwnerOrAdmin, checkTokenBlacklist } from '../middleware/authMiddleware.js';
import { Review } from '../models/Review.js';

const reviewRoutes = express.Router();

reviewRoutes.get('/', getReviews);
reviewRoutes.get('/:_id', validateReviewID, getReviewById);
reviewRoutes.post('/', checkAuth, validateReviewRegistration, checkTokenBlacklist, createReview);
reviewRoutes.put('/:_id', validateReviewModificar, checkAuth, checkTokenBlacklist, checkOwnerOrAdmin(Review, "_id"), updateReview);
reviewRoutes.delete('/:_id', validateReviewID, checkAuth, checkTokenBlacklist, checkOwnerOrAdmin(Review, "_id"), deleteReview);

export { reviewRoutes };