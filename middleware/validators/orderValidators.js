import { body, param } from 'express-validator';

const validateOrder = [
    // Shipping Address ID Validation
    body('shippingAddressId')
        .notEmpty().withMessage('La dirección de envío es requerida')
        .isMongoId().withMessage('El ID de dirección de envío debe ser un ID de MongoDB válido'),
    
    // Payment Method Validation
    body('paymentMethod')
        .notEmpty().withMessage('El método de pago es requerido')
        .isMongoId().withMessage('El ID del método de pago debe ser un ID de MongoDB válido'),
    
    // Shipping Method (carrier) Validation
    body('shippingMethod')
        .notEmpty().withMessage('El método de envío es requerido')
        .isMongoId().withMessage('ID del método de envío inválido'),
    
    // Additional Address Information
    body('recipientName')
        .optional()
        .isString().withMessage('El nombre del destinatario debe ser un texto'),
    
    body('phoneContact')
        .optional()
        .isString().withMessage('El teléfono de contacto debe ser un texto'),
    
    body('additionalInstructions')
        .optional()
        .isString().withMessage('Las instrucciones adicionales deben ser un texto'),
];

const validateOrderId = [
    param('orderId')
        .notEmpty().withMessage('El ID de la orden es requerido')
        .isMongoId().withMessage('El ID de la orden debe ser un ID de MongoDB válido')
];

export { validateOrder, validateOrderId };
