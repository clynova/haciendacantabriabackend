import { body, param } from 'express-validator';
import { CategoriaProducto, TipoCarne, CorteVacuno, TipoAceite, MetodoCoccion, TipoEnvase } from '../../models/Product.js';

// Base product validation rules
const baseProductValidationRules = [
    body('codigo')
        .trim()
        .notEmpty().withMessage('El código del producto es requerido')
        .isString().withMessage('El código debe ser una cadena de texto'),

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

    body('destacado')
        .optional()
        .isBoolean().withMessage('Destacado debe ser un valor booleano'),

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

    body('precios.descuentos.transferencia')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('El descuento por transferencia debe estar entre 0 y 100'),

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

// Meat product specific validation rules
const meatProductValidationRules = [
    body('infoCarne.tipoCarne')
        .notEmpty().withMessage('El tipo de carne es requerido')
        .isIn(TipoCarne).withMessage('Tipo de carne no válido'),

    body('infoCarne.corte')
        .optional()
        .isIn(CorteVacuno).withMessage('Corte no válido'),

    body('infoCarne.precioPorKg')
        .notEmpty().withMessage('El precio por kg es requerido')
        .isFloat({ min: 0 }).withMessage('El precio por kg debe ser un número positivo'),

    body('caracteristicas.porcentajeGrasa')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('El porcentaje de grasa debe estar entre 0 y 100'),

    body('caracteristicas.marmoleo')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage('El marmoleo debe estar entre 1 y 5'),

    body('coccion.metodos.*')
        .optional()
        .isIn(MetodoCoccion).withMessage('Método de cocción no válido'),

    body('empaque.tipo')
        .optional()
        .isIn(TipoEnvase).withMessage('Tipo de envase no válido'),

    body('inventario.stockKg')
        .notEmpty().withMessage('El stock en kg es requerido')
        .isFloat({ min: 0 }).withMessage('El stock en kg debe ser un número positivo')
];

// Oil product specific validation rules
const oilProductValidationRules = [
    body('infoAceite.tipo')
        .notEmpty().withMessage('El tipo de aceite es requerido')
        .isIn(TipoAceite).withMessage('Tipo de aceite no válido'),

    body('infoAceite.volumen')
        .notEmpty().withMessage('El volumen es requerido')
        .isFloat({ min: 0 }).withMessage('El volumen debe ser un número positivo'),

    body('infoAceite.envase')
        .optional()
        .isIn(TipoEnvase).withMessage('Tipo de envase no válido'),

    body('inventario.stockUnidades')
        .notEmpty().withMessage('El stock en unidades es requerido')
        .isInt({ min: 0 }).withMessage('El stock en unidades debe ser un número entero positivo')
];

const validateProductRegistration = [
    ...baseProductValidationRules,
    body('tipoProducto')
        .notEmpty().withMessage('El tipo de producto es requerido')
        .isIn(['ProductoCarne', 'ProductoAceite']).withMessage('Tipo de producto no válido')
];

const validateProductModificar = [
    param('_id')
        .notEmpty().withMessage('El ID es requerido')
        .isMongoId().withMessage('El ID no es válido'),
    body('codigo').optional().trim().notEmpty().withMessage('El código no puede estar vacío'),
    body('sku').optional().trim().notEmpty().withMessage('El SKU no puede estar vacío'),
    body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('categoria').optional().isIn(CategoriaProducto).withMessage('Categoría no válida'),
    body('tipoProducto').optional().isIn(['ProductoCarne', 'ProductoAceite']).withMessage('Tipo de producto no válido'),
    
    // Validaciones específicas para ProductoCarne
    body('infoCarne.tipoCarne').optional().isIn(TipoCarne).withMessage('Tipo de carne no válido'),
    body('infoCarne.corte').optional().isIn(CorteVacuno).withMessage('Corte no válido'),
    body('infoCarne.precioPorKg').optional().isFloat({ min: 0 }).withMessage('El precio por kg debe ser un número positivo'),
    
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
