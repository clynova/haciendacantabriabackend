import { check, param } from 'express-validator';

export const validateRegionCreation = [
    check('name')
        .trim()
        .notEmpty()
        .withMessage('El nombre de la región es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    check('code')
        .trim()
        .notEmpty()
        .withMessage('El código de la región es requerido')
        .isLength({ min: 2, max: 10 })
        .withMessage('El código debe tener entre 2 y 10 caracteres')
];

export const validateRegionUpdate = [
    param('id')
        .isMongoId()
        .withMessage('ID de región inválido'),
    check('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El nombre de la región no puede estar vacío')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    check('code')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El código de la región no puede estar vacío')
        .isLength({ min: 2, max: 10 })
        .withMessage('El código debe tener entre 2 y 10 caracteres'),
    check('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive debe ser un valor booleano')
];

export const validateRegionId = [
    param('id')
        .isMongoId()
        .withMessage('ID de región inválido')
];