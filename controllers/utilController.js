import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';

const getDashboardStats = async (req, res) => {
    try {
        // Obtener el conteo total de productos
        const totalProducts = await Product.countDocuments();
        
        // Obtener el conteo total de órdenes
        const totalOrders = await Order.countDocuments();
        
        // Obtener el conteo total de usuarios
        const totalUsers = await User.countDocuments();
        
        // Obtener todos los tags únicos de productos
        const products = await Product.find({}, 'tags');
        const allTags = products.reduce((acc, product) => {
            return acc.concat(product.tags);
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

export { getDashboardStats };