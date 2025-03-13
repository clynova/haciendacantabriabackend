import { body, param } from 'express-validator';

const validateReviewID = [
    param('_id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID no es válido'),
];

const validateReviewRegistration = [
    body('productId')
        .notEmpty().withMessage('El ID del producto es requerido')
        .isMongoId().withMessage('El ID del producto debe ser un ObjectId válido'),

    body('userId')
        .notEmpty().withMessage('El ID del usuario es requerido')
        .isMongoId().withMessage('El ID del usuario debe ser un ObjectId válido'),

    body('rating')
        .notEmpty().withMessage('La calificación es requerida')
        .isInt().withMessage('La calificación debe ser un número entero'),
];

const validateReviewModificar = [
    param('_id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID no es válido'),

    body('rating')
        .optional()
        .isInt().withMessage('La calificación debe ser un número entero'),
];

     

export { validateReviewRegistration, validateReviewModificar, validateReviewID };