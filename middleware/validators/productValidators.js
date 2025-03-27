import { body, param } from 'express-validator';
import { CategoriaProducto, TipoCarne, CorteVacuno, TipoAceite, MetodoCoccion, TipoEnvase } from '../../models/Product.js';

// Base product validation rules
const baseProductValidationRules = [
    body('sku')
        .trim()
        .notEmpty().withMessage('El SKU es requerido')
        .isString().withMessage('El SKU debe ser una cadena de texto'),

    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),

    body('categoria')
        .trim()
        .notEmpty().withMessage('La categoría es requerida')
        .isIn(CategoriaProducto).withMessage('Categoría no válida'),

    body('descripcion.corta')
        .optional()
        .isLength({ max: 160 }).withMessage('La descripción corta no puede exceder 160 caracteres'),

    body('descripcion.completa')
        .optional(),

    body('precios.base')
        .notEmpty().withMessage('El precio base es requerido')
        .isFloat({ min: 0 }).withMessage('El precio base debe ser un número positivo'),

    body('precios.descuentos.regular')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('El descuento regular debe estar entre 0 y 100'),

    body('multimedia.imagenes.*.url')
        .optional(),

    body('multimedia.imagenes.*.esPrincipal')
        .optional()
        .isBoolean().withMessage('esPrincipal debe ser un valor booleano'),

    body('conservacion.requiereRefrigeracion')
        .optional()
        .isBoolean().withMessage('requiereRefrigeracion debe ser un valor booleano'),

    body('conservacion.requiereCongelacion')
        .optional()
        .isBoolean().withMessage('requiereCongelacion debe ser un valor booleano')
];

const validateProductRegistration = [
    ...baseProductValidationRules,
    body('tipoProducto')
        .notEmpty().withMessage('El tipo de producto es requerido')
        .isIn(['ProductoCarne', 'ProductoAceite', 'ProductoBase']).withMessage('Tipo de producto no válido')
];

const validateProductModificar = [
    param('_id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID no es válido'),
    body('sku').optional().trim().notEmpty().withMessage('El SKU no puede estar vacío'),
    body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('categoria').optional().isIn(CategoriaProducto).withMessage('Categoría no válida'),
    body('tipoProducto').optional().isIn(['ProductoCarne', 'ProductoAceite']).withMessage('Tipo de producto no válido'),

    // Validaciones específicas para ProductoCarne
    body('infoCarne.tipoCarne').optional().isIn(TipoCarne).withMessage('Tipo de carne no válido'),
    body('infoCarne.corte').optional().isIn(CorteVacuno).withMessage('Corte no válido'),

    // Validaciones específicas para ProductoAceite
    body('infoAceite.tipo').optional().isIn(TipoAceite).withMessage('Tipo de aceite no válido'),
    body('infoAceite.volumen').optional().isFloat({ min: 0 }).withMessage('El volumen debe ser un número positivo'),
    body('infoAceite.envase').optional().isIn(TipoEnvase).withMessage('Tipo de envase no válido')
];

const validateProductID = [
    param('_id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID no es válido')
];

export { validateProductRegistration, validateProductModificar, validateProductID };
