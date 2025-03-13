import { body } from 'express-validator';

const validateCreatePaymentMethod = [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('type')
        .trim()
        .notEmpty().withMessage('El tipo es requerido')
        .isIn(['transferencia', 'webpay', 'mercadopago', 'flow']).withMessage('Tipo de pago no válido'),
    body('description')
        .optional()
        .trim(),
    body('provider')
        .trim()
        .notEmpty().withMessage('El proveedor es requerido')
        .isLength({ min: 2 }).withMessage('El proveedor debe tener al menos 2 caracteres'),
    body('logo_url')
        .optional()
        .trim()
        .isURL().withMessage('La URL del logo debe ser una URL válida'),
    body('requires_additional_data')
        .optional()
        .isBoolean().withMessage('El campo requires_additional_data debe ser un valor booleano'),
    body('additional_fields')
        .optional()
        .isArray().withMessage('Los campos adicionales deben ser un array'),
    body('additional_fields.*.name')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre del campo adicional es requerido'),
    body('additional_fields.*.type')
        .optional()
        .isIn(['text', 'number', 'email', 'date']).withMessage('Tipo de campo adicional no válido'),
    body('additional_fields.*.required')
        .optional()
        .isBoolean().withMessage('El campo required debe ser un valor booleano'),
    body('commission_percentage')
        .optional()
        .isNumeric().withMessage('El porcentaje de comisión debe ser un número')
        .custom((value) => {
            if (value < 0 || value > 100) {
                throw new Error('El porcentaje de comisión debe estar entre 0 y 100');
            }
            return true;
        }),
    body('active')
        .optional()
        .isBoolean().withMessage('El campo active debe ser un valor booleano')
];

const validateUpdatePaymentMethod = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre no puede estar vacío')
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('type')
        .optional()
        .trim()
        .notEmpty().withMessage('El tipo no puede estar vacío')
        .isIn(['transferencia', 'webpay', 'mercadopago', 'flow']).withMessage('Tipo de pago no válido'),
    body('description')
        .optional()
        .trim(),
    body('provider')
        .optional()
        .trim()
        .notEmpty().withMessage('El proveedor no puede estar vacío')
        .isLength({ min: 2 }).withMessage('El proveedor debe tener al menos 2 caracteres'),
    body('logo_url')
        .optional()
        .trim()
        .isURL().withMessage('La URL del logo debe ser una URL válida'),
    body('requires_additional_data')
        .optional()
        .isBoolean().withMessage('El campo requires_additional_data debe ser un valor booleano'),
    body('additional_fields')
        .optional()
        .isArray().withMessage('Los campos adicionales deben ser un array'),
    body('additional_fields.*.name')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre del campo adicional no puede estar vacío'),
    body('additional_fields.*.type')
        .optional()
        .isIn(['text', 'number', 'email', 'date']).withMessage('Tipo de campo adicional no válido'),
    body('additional_fields.*.required')
        .optional()
        .isBoolean().withMessage('El campo required debe ser un valor booleano'),
    body('commission_percentage')
        .optional()
        .isNumeric().withMessage('El porcentaje de comisión debe ser un número')
        .custom((value) => {
            if (value < 0 || value > 100) {
                throw new Error('El porcentaje de comisión debe estar entre 0 y 100');
            }
            return true;
        }),
    body('active')
        .optional()
        .isBoolean().withMessage('El campo active debe ser un valor booleano')
];

export { validateCreatePaymentMethod, validateUpdatePaymentMethod }; 