import { ProductoBase } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';

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
        // Obtener todas las órdenes completadas
        const completedOrders = await Order.find({ 
            status: 'completed',
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

export { getDashboardStats, getTopTags, getTotalSales };