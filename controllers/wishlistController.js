import { Wishlist } from '../models/Wishlist.js';
import { ProductoBase } from '../models/Product.js';
import { validationResult } from 'express-validator';

const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate({
            path: 'products',
            model: ProductoBase,
            select: 'nombre sku slug multimedia categoria opcionesPeso variantePredeterminada estado' // Seleccionamos solo los campos necesarios
        });
        
        if (!wishlist) {
            return res.status(200).json({
                success: true,
                msg: 'Wishlist vacía',
                data: { userId: req.user._id, products: [] }
            });
        }
        
        res.status(200).json({
            success: true,
            msg: 'Wishlist recuperada exitosamente',
            data: wishlist
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Error al obtener la wishlist' });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: 'Errores de validación', errors: errors.array() });
        }

        const { productId } = req.body;
        
        // Verificar si el producto existe
        const productoExiste = await ProductoBase.findById(productId);
        if (!productoExiste) {
            return res.status(404).json({ 
                success: false, 
                msg: 'El producto no existe' 
            });
        }
        
        let wishlist = await Wishlist.findOne({ userId: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId: req.user._id,
                products: [productId]
            });
        } else if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            wishlist.updatedAt = new Date();
        } else {
            return res.status(200).json({
                success: true,
                msg: 'El producto ya está en tu wishlist',
                data: wishlist
            });
        }

        await wishlist.save();
        
        // Obtener la wishlist con los productos populados para devolver
        const populatedWishlist = await Wishlist.findById(wishlist._id).populate({
            path: 'products',
            model: ProductoBase,
            select: 'nombre sku slug multimedia categoria opcionesPeso variantePredeterminada estado'
        });
        
        res.status(200).json({
            success: true,
            msg: 'Producto añadido a la wishlist',
            data: populatedWishlist
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Error al añadir a la wishlist' });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const wishlist = await Wishlist.findOne({ userId: req.user._id });

        if (!wishlist) {
            return res.status(404).json({ success: false, msg: 'Wishlist no encontrada' });
        }

        // Verificar si el producto estaba en la wishlist
        const productoEncontrado = wishlist.products.find(id => id.toString() === productId);
        if (!productoEncontrado) {
            return res.status(404).json({ 
                success: false, 
                msg: 'Producto no encontrado en la wishlist' 
            });
        }

        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
        wishlist.updatedAt = new Date();
        await wishlist.save();
        
        // Populate products para la respuesta
        const populatedWishlist = await Wishlist.findById(wishlist._id).populate({
            path: 'products',
            model: ProductoBase,
            select: 'nombre sku slug multimedia categoria opcionesPeso variantePredeterminada estado'
        });

        res.status(200).json({
            success: true,
            msg: 'Producto eliminado de la wishlist',
            data: populatedWishlist
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Error al eliminar de la wishlist' });
    }
};

const clearWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id });

        if (!wishlist) {
            return res.status(404).json({ success: false, msg: 'Wishlist no encontrada' });
        }

        wishlist.products = [];
        wishlist.updatedAt = new Date();
        await wishlist.save();

        res.status(200).json({
            success: true,
            msg: 'Wishlist vaciada exitosamente',
            data: wishlist
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: 'Error al vaciar la wishlist' });
    }
};

export { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
