import express from 'express';
import {
    registrar,
    confirmar,
    autenticar,
    resetPassword,
    comprobarToken,
    nuevoPassword,
    updateProfile,
    changePassword,
    deleteAccount,
    getAllUsers,
    getUserById,
    logout,
    getUser,
    addAddress,
    updateAddress,
    deleteAddress,
    setActiveAddress,
    getAddresses
} from '../controllers/userController.js';
import {
    validateUserRegistration,
    validarAutenticar,
    validarNuevaPassword,
    validarCambiarPassword,
    addressValidationRules
} from '../middleware/validators/userValidators.js';
import { checkAuth, checkTokenBlacklist, checkRole, checkOwnerOrAdmin, validateToken } from '../middleware/authMiddleware.js';
import { User } from '../models/User.js';

const userRoutes = express.Router();

// Rutas públicas (no requieren autenticación)
userRoutes.post('/registrar', validateUserRegistration, registrar); // Registrar un nuevo usuario
userRoutes.post('/confirmar', confirmar); // Cambio de GET a POST para recibir email y token
userRoutes.post('/autenticar', validarAutenticar, autenticar); // Autenticar usuario (login)
userRoutes.get('/logout', logout); // Cerrar sesión e invalidar token
userRoutes.get('/validate-token', validateToken); // Validar token

// Rutas para restablecer contraseña
userRoutes.post('/reset-password', resetPassword); // Solicitar restablecimiento de contraseña
userRoutes.get('/reset-password/:token', comprobarToken); // Verificar token de restablecimiento
userRoutes.post('/reset-password/:token', validarNuevaPassword, nuevoPassword); // Establecer nueva contraseña

// Rutas protegidas (requieren autenticación y validación de token)
userRoutes.use(checkAuth, checkTokenBlacklist); // Middleware aplicado a todas las rutas siguientes

userRoutes.get('/perfil', getUser); // Obtener perfil del usuario autenticado
userRoutes.post('/perfil', checkRole("admin"),  getUserById); // Obtener perfil de un usuario específico (solo para administradores)
userRoutes.put('/perfil', updateProfile); // Actualizar perfil del usuario autenticado
userRoutes.put('/change-password', validarCambiarPassword, changePassword); // Cambiar contraseña del usuario autenticado
userRoutes.delete('/delete-account/:userId', deleteAccount); // Eliminar cuenta (propia o de otro usuario si es admin)

// Rutas de administración (solo para administradores)
userRoutes.get('/all', checkRole('admin'), getAllUsers); // Obtener todos los usuarios (solo para administradores)

// Rutas de direcciones
userRoutes.post('/addresses', addressValidationRules, addAddress);
userRoutes.get('/addresses', getAddresses);
userRoutes.put('/addresses/:addressId', addressValidationRules, updateAddress);
userRoutes.delete('/addresses/:addressId', deleteAddress);
userRoutes.put('/addresses/:addressId/active', setActiveAddress);

export { userRoutes };