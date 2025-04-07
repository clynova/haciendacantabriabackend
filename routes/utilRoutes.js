import express from 'express';
import { getDashboardStats, getTopTags, getTotalSales, getQuotationStats, getOrderStats, getTopProducts, enviarPDFporEmail } from '../controllers/utilController.js';
import { checkAuth, checkRole } from '../middleware/authMiddleware.js';
import { handleContactForm } from '../controllers/contactController.js';
import { enviarEmailConfirmacionOrden } from '../controllers/emailController.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const utilRoutes = express.Router();

// Configuración de multer para la carga de archivos PDF
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/tmp'); // Usar directorio temporal del sistema
    },
    filename: function (req, file, cb) {
        // Generar nombre de archivo seguro con hash para evitar inyecciones en nombres de archivo
        const randomHash = crypto.randomBytes(16).toString('hex');
        cb(null, `doc-${randomHash}${path.extname(file.originalname)}`);
    }
});

// Filtro para asegurar que solo se acepten archivos PDF
const fileFilter = (req, file, cb) => {
    // Verificar que el archivo sea un PDF tanto por mimetype como por extensión
    if (file.mimetype === 'application/pdf' && 
        path.extname(file.originalname).toLowerCase() === '.pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF'), false);
    }
};

// Configuración de multer
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB para reducir riesgo de DoS
    }
});

// Middleware personalizado para manejar diferentes formas de enviar el PDF
const handlePdfUpload = (req, res, next) => {
    // Si el cliente envía el PDF como un archivo adjunto, usar multer
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        upload.single('pdfFile')(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    // Error de multer (tamaño, tipo, etc.)
                    return res.status(400).json({
                        success: false,
                        msg: `Error al cargar el archivo: ${err.message}`
                    });
                } else {
                    // Otro tipo de error
                    return res.status(500).json({
                        success: false,
                        msg: `Error inesperado al cargar el archivo: ${err.message}`
                    });
                }
            }
            next();
        });
    } else if (req.headers['content-type']?.includes('application/json')) {
        // Si el cliente envía el PDF como base64 en el cuerpo JSON
        // Realizar comprobaciones de seguridad básicas antes de procesar
        if (!req.body.pdfFile) {
            return res.status(400).json({
                success: false,
                msg: 'No se ha proporcionado ningún archivo PDF en el campo pdfFile'
            });
        }
        
        if (!req.body.pdfFile.startsWith('data:application/pdf;base64,')) {
            return res.status(400).json({
                success: false,
                msg: 'El formato del PDF proporcionado no es válido'
            });
        }
        
        // Estimar tamaño del PDF decodificado (aproximado)
        const base64Data = req.body.pdfFile.replace(/^data:application\/pdf;base64,/, '');
        const estimatedSize = Math.ceil((base64Data.length * 3) / 4);
        
        if (estimatedSize > 5 * 1024 * 1024) { // 5MB
            return res.status(400).json({
                success: false,
                msg: 'El archivo PDF excede el tamaño máximo permitido de 5MB'
            });
        }
        
        next();
    } else {
        return res.status(415).json({
            success: false,
            msg: 'Content-Type no soportado. Debe ser multipart/form-data o application/json'
        });
    }
};

// Middleware para validar una dirección de email
const validateEmail = (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            msg: 'El correo electrónico es requerido'
        });
    }
    
    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            msg: 'El formato del correo electrónico no es válido'
        });
    }
    
    next();
};

utilRoutes.get('/getdashboardstats', checkAuth, getDashboardStats);
utilRoutes.get('/top-tags', checkAuth, getTopTags);
utilRoutes.get('/total-sales', checkAuth, getTotalSales);
utilRoutes.get('/quotation-stats', checkAuth, getQuotationStats);
utilRoutes.get('/order-stats', checkAuth, getOrderStats);
utilRoutes.get('/top-products', getTopProducts);

utilRoutes.post('/contact', handleContactForm);
utilRoutes.get('/send-emailOrder/:orderId', checkAuth, enviarEmailConfirmacionOrden);

// Ruta para enviar PDF por correo electrónico que maneja tanto archivos como base64
utilRoutes.post('/send-pdf', 
    checkAuth, 
    checkRole('admin'), 
    validateEmail,
    handlePdfUpload, 
    enviarPDFporEmail
);

export { utilRoutes };
