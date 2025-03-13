import { body } from 'express-validator';
import { check } from 'express-validator';

const validateUserRegistration = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isAlpha('es-ES', { ignore: ' ' }).withMessage('El nombre solo puede contener letras')
        .isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('El apellido es requerido')
        .isAlpha('es-ES', { ignore: ' ' }).withMessage('El apellido solo puede contener letras')
        .isLength({ min: 2 }).withMessage('El apellido debe tener al menos 2 caracteres'),

    body('email')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('El correo no es válido'),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe incluir al menos una letra mayúscula')
        .matches(/\d/).withMessage('La contraseña debe incluir al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe incluir al menos un carácter especial (!@#$%^&*)'),

    body('repPassword')
        .notEmpty().withMessage('La confirmación de la contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La confirmación de la contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La confirmación de la contraseña debe incluir al menos una letra mayúscula')
        .matches(/\d/).withMessage('La confirmación de la contraseña debe incluir al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La confirmación de la contraseña debe incluir al menos un carácter especial (!@#$%^&*)')
];

const validarAutenticar = [
    body('email')
        .trim()
        .notEmpty().withMessage('El correo es requerido')
        .isEmail().withMessage('El correo no es válido'),

    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/\d/).withMessage('La contraseña debe incluir al menos un número')
];

const validarNuevaPassword = [
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe incluir al menos una letra mayúscula')
        .matches(/\d/).withMessage('La contraseña debe incluir al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe incluir al menos un carácter especial (!@#$%^&*)'),
];

const validarCambiarPassword = [
    body('currentPassword')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe incluir al menos una letra mayúscula')
        .matches(/\d/).withMessage('La contraseña debe incluir al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe incluir al menos un carácter especial (!@#$%^&*)'),

    body('newPassword')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe incluir al menos una letra mayúscula')
        .matches(/\d/).withMessage('La contraseña debe incluir al menos un número')
        .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe incluir al menos un carácter especial (!@#$%^&*)'),

    body('repNewPassword')
        .notEmpty().withMessage('La confirmación de la contraseña es requerida')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }),
];

const addressValidationRules = [
    check('street')
        .notEmpty()
        .withMessage('La calle es requerida')
        .isLength({ min: 3 })
        .withMessage('La calle debe tener al menos 3 caracteres'),
    check('city')
        .notEmpty()
        .withMessage('La ciudad es requerida')
        .isLength({ min: 2 })
        .withMessage('La ciudad debe tener al menos 2 caracteres'),
    check('state')
        .notEmpty()
        .withMessage('El estado es requerido')
        .isLength({ min: 2 })
        .withMessage('El estado debe tener al menos 2 caracteres'),
    check('country')
        .notEmpty()
        .withMessage('El país es requerido')
        .isLength({ min: 2 })
        .withMessage('El país debe tener al menos 2 caracteres'),
    check('zipCode')
        .notEmpty()
        .withMessage('El código postal es requerido')
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('El código postal debe tener un formato válido (12345 o 12345-6789)'),
    check('reference')
        .optional()
        .isLength({ max: 200 })
        .withMessage('La referencia no debe exceder los 200 caracteres'),
    check('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault debe ser un valor booleano')
];

export {
    validateUserRegistration,
    validarAutenticar,
    validarNuevaPassword,
    validarCambiarPassword,
    addressValidationRules
};
