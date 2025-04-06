import express from 'express';
import { getDashboardStats, getTopTags, getTotalSales, getQuotationStats, getOrderStats, getTopProducts, enviarPDFporEmail } from '../controllers/utilController.js';
import { checkAuth, checkRole } from '../middleware/authMiddleware.js';
import { handleContactForm } from '../controllers/contactController.js';
import { enviarEmailConfirmacionOrden } from '../controllers/emailController.js';
import multer from 'multer';
import path from 'path';

const utilRoutes = express.Router();

// Configuración de multer para la carga de archivos PDF
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/tmp'); // Usar directorio temporal del sistema
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para asegurar que solo se acepten archivos PDF
const fileFilter = (req, file, cb) => {
    // Verificar que el archivo sea un PDF
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('El archivo debe ser un PDF'), false);
    }
};

// Configuración de multer
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limitar a 5MB
    }
});

utilRoutes.get('/getdashboardstats', checkAuth, getDashboardStats);
utilRoutes.get('/top-tags', checkAuth, getTopTags);
utilRoutes.get('/total-sales', checkAuth, getTotalSales);
utilRoutes.get('/quotation-stats', checkAuth, getQuotationStats);
utilRoutes.get('/order-stats', checkAuth, getOrderStats);
utilRoutes.get('/top-products', getTopProducts); // Nueva ruta

utilRoutes.post('/contact', handleContactForm);
utilRoutes.get('/send-emailOrder/:orderId', checkAuth, enviarEmailConfirmacionOrden);

// Nueva ruta para enviar PDF por correo electrónico
utilRoutes.post('/send-pdf', checkAuth, checkRole('admin'), upload.single('pdfFile'), enviarPDFporEmail);

export { utilRoutes };
