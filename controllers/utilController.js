import { ProductoBase } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Quotation } from '../models/Quotation.js';
import { OrderDetail } from '../models/OrderDetail.js';
import { enviarEmailConPDF } from '../controllers/emailController.js';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';


const getDashboardStats = async (req, res) => {
    try {
        // Obtener el conteo total de productos
        const totalProducts = await ProductoBase.countDocuments();
        
        // Obtener el conteo total de órdenes
        const totalOrders = await Order.countDocuments();
        
        // Obtener el conteo total de usuarios
        const totalUsers = await User.countDocuments();
        
        // Obtener todos los tags únicos de productos
        const productos = await ProductoBase.find({}, 'tags');
        const allTags = productos.reduce((acc, producto) => {
            return acc.concat(producto.tags);
        }, []);
        const uniqueTags = [...new Set(allTags)];
        const totalTags = uniqueTags.length;

        const data = {
            totalProducts,
            totalOrders,
            totalUsers,
            totalTags,
            uniqueTags
        };

        res.status(200).send({ success: true, msg: 'Estadisticas enviadas', data });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener las estadísticas del dashboard',
            error: error.message 
        });
    }
};

/**
 * Obtiene los 5 tags más utilizados en los productos, ordenados por frecuencia
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getTopTags = async (req, res) => {
    try {
        // Obtener todos los productos con sus tags
        const productos = await ProductoBase.find({}, 'tags');
        
        // Crear un objeto para contar la frecuencia de cada tag
        const tagCounts = {};
        
        // Contar la frecuencia de cada tag
        productos.forEach(producto => {
            if (producto.tags && producto.tags.length > 0) {
                producto.tags.forEach(tag => {
                    if (tag) {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    }
                });
            }
        });
        
        // Convertir el objeto a un array de objetos para poder ordenarlo
        const tagsArray = Object.keys(tagCounts).map(tag => ({
            nombre: tag,
            frecuencia: tagCounts[tag]
        }));
        
        // Ordenar el array por frecuencia en orden descendente
        tagsArray.sort((a, b) => b.frecuencia - a.frecuencia);
        
        // Tomar los primeros 5 elementos
        const topTags = tagsArray.slice(0, 5);
        
        res.status(200).send({ 
            success: true, 
            msg: 'Top 5 tags más utilizados', 
            data: topTags 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener los tags más utilizados',
            error: error.message 
        });
    }
};

/**
 * Obtiene el monto total de ventas realizadas
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getTotalSales = async (req, res) => {
    try {
        // Obtener todas las órdenes completadas o finalizadas
        const completedOrders = await Order.find({ 
            status: { $in: ['finalized'] },
            'payment.status': 'completed' 
        });
        
        // Calcular el total de ventas
        const totalSales = completedOrders.reduce((sum, order) => sum + order.total, 0);
        
        // Obtener ventas por método de pago
        const paymentMethods = {};
        completedOrders.forEach(order => {
            const method = order.paymentMethod || 'unknown';
            if (!paymentMethods[method]) {
                paymentMethods[method] = 0;
            }
            paymentMethods[method] += order.total;
        });
        
        // Ordenar los métodos de pago por monto en orden descendente
        const paymentMethodsArray = Object.keys(paymentMethods).map(method => ({
            metodo: method,
            monto: paymentMethods[method]
        }));
        paymentMethodsArray.sort((a, b) => b.monto - a.monto);
        
        // Ventas por mes (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const monthlySales = {};
        completedOrders.forEach(order => {
            const orderDate = new Date(order.orderDate);
            if (orderDate >= sixMonthsAgo) {
                const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
                if (!monthlySales[monthKey]) {
                    monthlySales[monthKey] = {
                        year: orderDate.getFullYear(),
                        month: orderDate.getMonth() + 1,
                        total: 0,
                        count: 0
                    };
                }
                monthlySales[monthKey].total += order.total;
                monthlySales[monthKey].count += 1;
            }
        });
        
        // Convertir a array y ordenar por fecha
        const monthlySalesArray = Object.values(monthlySales).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });
        
        res.status(200).send({ 
            success: true, 
            msg: 'Ventas totales', 
            data: {
                totalSales: totalSales,
                totalOrders: completedOrders.length,
                avgOrderValue: completedOrders.length ? (totalSales / completedOrders.length) : 0,
                paymentMethods: paymentMethodsArray,
                monthlySales: monthlySalesArray
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener el total de ventas',
            error: error.message 
        });
    }
};

const getQuotationStats = async (req, res) => {
    try {
        // Obtener el conteo de cotizaciones por cada status
        const stats = await Quotation.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    total: { $sum: "$total" }
                }
            }
        ]);

        // Crear un objeto con los conteos inicializados en 0
        const quotationStats = {
            pending: { count: 0, total: 0 },
            completed: { count: 0, total: 0 },
            canceled: { count: 0, total: 0 },
            finalized: { count: 0, total: 0 }
        };

        // Llenar los datos reales
        stats.forEach(stat => {
            if (quotationStats.hasOwnProperty(stat._id)) {
                quotationStats[stat._id] = {
                    count: stat.count,
                    total: stat.total
                };
            }
        });

        // Calcular totales generales
        const totalQuotations = Object.values(quotationStats).reduce((sum, stat) => sum + stat.count, 0);
        const totalAmount = Object.values(quotationStats).reduce((sum, stat) => sum + stat.total, 0);

        res.status(200).send({
            success: true,
            msg: 'Estadísticas de cotizaciones',
            data: {
                byStatus: quotationStats,
                totalQuotations,
                totalAmount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas de cotizaciones',
            error: error.message
        });
    }
};

const getOrderStats = async (req, res) => {
    try {
        // Obtener el conteo de órdenes por cada status
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    total: { $sum: "$total" }
                }
            }
        ]);

        // Crear un objeto con los conteos inicializados en 0
        const orderStats = {
            pending: { count: 0, total: 0 },
            completed: { count: 0, total: 0 },
            canceled: { count: 0, total: 0 },
            finalized: { count: 0, total: 0 }
        };

        // Llenar los datos reales
        stats.forEach(stat => {
            if (orderStats.hasOwnProperty(stat._id)) {
                orderStats[stat._id] = {
                    count: stat.count,
                    total: stat.total
                };
            }
        });

        // Calcular totales generales
        const totalOrders = Object.values(orderStats).reduce((sum, stat) => sum + stat.count, 0);
        const totalAmount = Object.values(orderStats).reduce((sum, stat) => sum + stat.total, 0);

        res.status(200).send({
            success: true,
            msg: 'Estadísticas de órdenes',
            data: {
                byStatus: orderStats,
                totalOrders,
                totalAmount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas de órdenes',
            error: error.message
        });
    }
};

const getTopProducts = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        // Agregar los detalles de órdenes para obtener los productos más vendidos
        const topProducts = await OrderDetail.aggregate([
            // Agrupar por producto y sumar cantidades
            {
                $group: {
                    _id: "$productId",
                    totalVendido: { $sum: "$quantity" },
                    totalIngresos: { $sum: { $multiply: ["$price", "$quantity"] } }
                }
            },
            // Ordenar por cantidad vendida descendente
            { $sort: { totalVendido: -1 } },
            // Limitar resultados
            { $limit: parseInt(limit) },
            // Obtener información del producto
            {
                $lookup: {
                    from: "productos",
                    localField: "_id",
                    foreignField: "_id",
                    as: "producto"
                }
            },
            // Desempaquetar el array de producto
            { $unwind: "$producto" },
            // Dar formato a la salida
            {
                $project: {
                    _id: 1,
                    nombre: "$producto.nombre",
                    sku: "$producto.sku",
                    totalVendido: 1,
                    totalIngresos: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            msg: 'Productos más vendidos',
            data: topProducts
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            msg: 'Error al obtener los productos más vendidos',
            error: error.message
        });
    }
};

/**
 * Envía un PDF (boleta o factura) por correo electrónico al usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const enviarPDFporEmail = async (req, res) => {
    let tempFilePath = null;
    
    try {
        console.log('Iniciando el envío de PDF por correo electrónico...');
        
        // Variables para manejar el PDF
        let pdfBuffer;

        // Comprobar si el PDF viene como un archivo a través de multer o como base64 en el cuerpo
        if (req.file) {
            // Si viene como archivo (vía multer)
            if (req.file.buffer) {
                pdfBuffer = req.file.buffer;
            } else if (req.file.path) {
                pdfBuffer = await promisify(fs.readFile)(req.file.path);
                tempFilePath = req.file.path; // Para eliminar después
            }
        } else if (req.body.pdfFile && req.body.pdfFile.startsWith('data:application/pdf;base64,')) {
            // Si viene como base64 en el cuerpo de la solicitud
            const base64Data = req.body.pdfFile.replace(/^data:application\/pdf;base64,/, '');
            
            try {
                // Intentar decodificar el base64 para asegurar que es válido
                pdfBuffer = Buffer.from(base64Data, 'base64');
                
                // Verificar que el archivo comienza con la firma de PDF "%PDF-"
                if (!pdfBuffer.slice(0, 5).toString().startsWith('%PDF-')) {
                    throw new Error('El contenido no es un PDF válido');
                }
                
                // Crear un archivo temporal con nombre seguro usando crypto
                const randomHash = crypto.randomBytes(16).toString('hex');
                tempFilePath = `/tmp/doc-${randomHash}.pdf`;
                await promisify(fs.writeFile)(tempFilePath, pdfBuffer, { mode: 0o600 }); // Permisos restrictivos
            } catch (error) {
                console.error('Error procesando PDF base64:', error);
                return res.status(400).json({
                    success: false,
                    msg: 'El contenido base64 proporcionado no es un PDF válido'
                });
            }
        }

        // Verificar que tenemos un buffer de PDF
        if (!pdfBuffer || pdfBuffer.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'No se ha proporcionado ningún archivo PDF válido o el archivo está vacío'
            });
        }

        // Obtener el email del usuario desde el cuerpo de la solicitud (ya validado por el middleware)
        const { email, documentType = 'boleta', documentNumber = '', orderId } = req.body;

        // Sanitizar valores de entrada
        const sanitizedDocType = documentType.toLowerCase() === 'factura' ? 'factura' : 'boleta';
        const sanitizedDocNumber = documentNumber.replace(/[^a-zA-Z0-9-]/g, ''); // Solo permitir alphanumeric y guión

        // Buscar información del usuario por email
        const usuario = await User.findOne({ email });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                msg: 'No se encontró ningún usuario con ese correo electrónico'
            });
        }

        // Configurar datos para el envío del email
        const datosEmail = {
            email,
            firstName: usuario.firstName || 'Estimado Cliente',
            lastName: usuario.lastName || '',
            pdfBuffer,
            documentType: sanitizedDocType,
            documentNumber: sanitizedDocNumber
        };

        // Enviar el email con el PDF adjunto
        const resultado = await enviarEmailConPDF(datosEmail);
        if (resultado.success) {

            const resultOrder = await Order.findById(orderId);
            if (resultOrder) {
                resultOrder.facturacion.status = true;
                await resultOrder.save();
            }

            return res.status(200).json({
                success: true,
                msg: `${sanitizedDocType === 'factura' ? 'Factura' : 'Boleta'} enviada exitosamente por correo electrónico`,
                data: {
                    email,
                    messageId: resultado.messageId
                }
            });
        } else {
            throw new Error(resultado.error || 'Error al enviar el email');
        }
    } catch (error) {
        console.error('Error en enviarPDFporEmail:', error);
        
        return res.status(500).json({
            success: false,
            msg: 'Error al enviar el PDF por correo electrónico',
            error: error.message
        });
    } finally {
        // Eliminar archivos temporales siempre, incluso si hay errores
        if (tempFilePath) {
            try {
                await promisify(fs.unlink)(tempFilePath);
            } catch (cleanupError) {
                console.error('Error al eliminar archivo temporal:', cleanupError);
                // No enviamos el error al cliente, es solo para logging
            }
        }
        
        // Si hay un archivo de multer, asegurarse de eliminarlo también
        if (req.file && req.file.path && req.file.path !== tempFilePath) {
            try {
                await promisify(fs.unlink)(req.file.path);
            } catch (cleanupError) {
                console.error('Error al eliminar archivo de multer:', cleanupError);
            }
        }
    }
};

export { 
    getDashboardStats, 
    getTopTags, 
    getTotalSales, 
    getQuotationStats, 
    getOrderStats, 
    getTopProducts,
    enviarPDFporEmail 
};