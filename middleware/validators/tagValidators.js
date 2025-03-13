import { body, param } from 'express-validator';

// Validador para operaciones que requieren un ID de producto
const validateProductID = [
    param('productId')
        .isMongoId()
        .withMessage('El ID del producto no es válido')
];

// Validador para operaciones que manipulan etiquetas
const validateTagOperations = [
    param('productId')
        .isMongoId()
        .withMessage('El ID del producto no es válido'),
    body('tags')
        .isArray()
        .withMessage('Las etiquetas deben ser un array')
        .custom(tags => {
            return tags.every(tag => typeof tag === 'string' && tag.trim().length > 0);
        })
        .withMessage('Todas las etiquetas deben ser cadenas de texto no vacías')
];

// Validador para la operación de renombrar etiquetas
const validateRenameTag = [
    body('oldTag')
        .isString()
        .withMessage('La etiqueta original debe ser una cadena de texto')
        .notEmpty()
        .withMessage('La etiqueta original no puede estar vacía'),
    body('newTag')
        .isString()
        .withMessage('La nueva etiqueta debe ser una cadena de texto')
        .notEmpty()
        .withMessage('La nueva etiqueta no puede estar vacía')
];

// Validador para la operación de eliminar una etiqueta
const validateDeleteTag = [
    param('tag')
        .isString()
        .withMessage('La etiqueta debe ser una cadena de texto')
        .notEmpty()
        .withMessage('La etiqueta no puede estar vacía')
];

export { validateProductID, validateTagOperations, validateRenameTag, validateDeleteTag }; 