import { Wishlist } from '../models/Wishlist.js';
import { validationResult } from 'express-validator';

const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.user._id }).populate('products');
        res.status(200).json({
            success: true,
            msg: 'Wishlist recuperada exitosamente',
            data: wishlist || { products: [] }
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
        let wishlist = await Wishlist.findOne({ userId: req.user._id });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId: req.user._id,
                products: [productId]
            });
        } else if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            wishlist.updatedAt = new Date();
        }

        await wishlist.save();
        res.status(200).json({
            success: true,
            msg: 'Producto añadido a la wishlist',
            data: wishlist
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

        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
        wishlist.updatedAt = new Date();
        await wishlist.save();

        res.status(200).json({
            success: true,
            msg: 'Producto eliminado de la wishlist',
            data: wishlist
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
