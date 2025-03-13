import { body, param } from 'express-validator';

const validateProductRegistration = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre del producto es requerido')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),

    body('description')
        .trim()
        .notEmpty().withMessage('La descripción es requerida')
        .isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres'),

    body('price')
        .notEmpty().withMessage('El precio es requerido')
        .isFloat({ gt: 0 }).withMessage('El precio debe ser un número mayor a 0'),

    body('images')
        .optional()
        .isArray().withMessage('Las imágenes deben ser un array')
        .custom((images) => {
            if (!images.every(img => /\.(jpg|jpeg|png|webp|gif)$/.test(img))) {
                throw new Error('Cada imagen debe tener un formato válido (JPG, PNG, WEBP o GIF)');
            }
            return true;
        }),

    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),

    body('createdAt')
        .optional()
        .isISO8601().withMessage('La fecha de creación debe ser una fecha válida'),

    body('updatedAt')
        .optional()
        .isISO8601().withMessage('La fecha de actualización debe ser una fecha válida'),
];

const validateProductModificar = [
    param('_id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID no es válido'),

    body('name')
        .trim()
        .optional()
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),

    body('description')
        .trim()
        .optional()
        .isLength({ min: 10, max: 1000 }).withMessage('La descripción debe tener entre 10 y 1000 caracteres'),

    body('price')
        .optional()
        .isFloat({ gt: 0, lt: 1000000 }).withMessage('El precio debe ser un número mayor a 0 y menor a 1,000,000'),

    body('images')
        .optional()
        .isArray({ min: 1, max: 10 }).withMessage('Debes proporcionar entre 1 y 10 imágenes')
        .custom((images) => {
            if (!images.every(img => /\.(jpg|jpeg|png|webp|gif)$/.test(img))) {
                throw new Error('Cada imagen debe tener un formato válido (JPG, PNG, WEBP o GIF)');
            }
            return true;
        }),

    body('stock')
        .optional()
        .isInt({ min: 0, max: 100000 }).withMessage('El stock debe ser un número entero entre 0 y 100,000'),

    body('createdAt')
        .optional()
        .isISO8601().withMessage('La fecha de creación debe ser una fecha válida')
        .custom((value) => {
            if (new Date(value) > new Date()) {
                throw new Error('La fecha de creación no puede ser futura');
            }
            return true;
        }),

    body('updatedAt')
        .optional()
        .isISO8601().withMessage('La fecha de actualización debe ser una fecha válida')
        .custom((value) => {
            if (new Date(value) > new Date()) {
                throw new Error('La fecha de actualización no puede ser futura');
            }
            return true;
        }),
];

const validateProductID = [
    param('_id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID no es válido'),
];

export { validateProductRegistration, validateProductModificar, validateProductID };
