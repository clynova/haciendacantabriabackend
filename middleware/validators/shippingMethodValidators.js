import { body } from 'express-validator';

const validateCreateShippingMethod = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('tracking_url')
        .optional()
        .trim()
        .isURL().withMessage('La URL de seguimiento debe ser una URL válida'),
    body('methods')
        .isArray({ min: 1 }).withMessage('Debe proporcionar al menos un método de envío'),
    body('methods.*.name')
        .trim()
        .notEmpty().withMessage('El nombre del método es requerido')
        .isLength({ min: 2 }).withMessage('El nombre del método debe tener al menos 2 caracteres'),
    body('methods.*.delivery_time')
        .trim()
        .notEmpty().withMessage('El tiempo de entrega es requerido'),
    body('methods.*.base_cost')
        .notEmpty().withMessage('El costo base es requerido')
        .isNumeric().withMessage('El costo base debe ser un número')
        .custom((value) => {
            if (value < 0) {
                throw new Error('El costo base no puede ser negativo');
            }
            return true;
        }),
    body('methods.*.extra_cost_per_kg')
        .optional()
        .isNumeric().withMessage('El costo extra por kg debe ser un número')
        .custom((value) => {
            if (value < 0) {
                throw new Error('El costo extra por kg no puede ser negativo');
            }
            return true;
        }),
    body('active')
        .optional()
        .isBoolean().withMessage('El campo active debe ser un valor booleano')
];

const validateUpdateShippingMethod = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre no puede estar vacío')
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('tracking_url')
        .optional()
        .trim()
        .isURL().withMessage('La URL de seguimiento debe ser una URL válida'),
    body('methods')
        .optional()
        .isArray().withMessage('Los métodos deben ser un array'),
    body('methods.*.name')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre del método no puede estar vacío')
        .isLength({ min: 2 }).withMessage('El nombre del método debe tener al menos 2 caracteres'),
    body('methods.*.delivery_time')
        .optional()
        .trim()
        .notEmpty().withMessage('El tiempo de entrega no puede estar vacío'),
    body('methods.*.base_cost')
        .optional()
        .isNumeric().withMessage('El costo base debe ser un número')
        .custom((value) => {
            if (value < 0) {
                throw new Error('El costo base no puede ser negativo');
            }
            return true;
        }),
    body('methods.*.extra_cost_per_kg')
        .optional()
        .isNumeric().withMessage('El costo extra por kg debe ser un número')
        .custom((value) => {
            if (value < 0) {
                throw new Error('El costo extra por kg no puede ser negativo');
            }
            return true;
        }),
    body('active')
        .optional()
        .isBoolean().withMessage('El campo active debe ser un valor booleano')
];

export { validateCreateShippingMethod, validateUpdateShippingMethod };