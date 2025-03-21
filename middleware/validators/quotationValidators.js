import { check } from 'express-validator';

export const validateCreateQuotation = [
    check('shippingAddressId')
        .notEmpty()
        .withMessage('La dirección de envío es requerida'),
    
    check('shippingMethod')
        .notEmpty()
        .withMessage('El método de envío es requerido'),
    
    check('recipientName')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('El nombre del destinatario debe tener al menos 2 caracteres'),
    
    check('phoneContact')
        .optional()
        .trim()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
        .withMessage('Formato de teléfono inválido'),
    
    check('validityDays')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Los días de validez deben estar entre 1 y 30'),
    
    check('additionalInstructions')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Las instrucciones adicionales no pueden exceder los 500 caracteres')
];