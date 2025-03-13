import { Cart } from '../models/Cart.js';
import { Product } from "../models/Product.js";
import mongoose from 'mongoose';

const addToCart = async (req, res) => {
    try {
        let { productId, quantity } = req.body;
        const userId = req.user._id;

        // Validar el ID del producto
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, msg: "ID de producto inválido" });
        }

        // Validar la cantidad
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, msg: "Cantidad inválida" });
        }

        // Verificar si el producto existe
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, msg: "Producto no encontrado" });
        }

        // Buscar el carrito del usuario
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // Si no existe, crear un nuevo carrito con el producto
            cart = new Cart({
                userId,
                products: [{ productId, quantity }],
            });
        } else {
            // Buscar si el producto ya está en el carrito
            const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);

            if (productIndex > -1) {
                // Si el producto ya está en el carrito, incrementar la cantidad
                cart.products[productIndex].quantity += quantity;
            } else {
                // Si el producto no está en el carrito, agregarlo
                cart.products.push({ productId, quantity });
            }
        }

        // Actualizar la fecha de modificación y guardar el carrito
        cart.updatedAt = new Date();
        await cart.save();

        // Responder con el carrito actualizado
        res.status(200).json({ success: true, cart });

    } catch (err) {
        console.error("Error al agregar al carrito:", err);
        res.status(500).json({ success: false, msg: "Error al agregar al carrito" });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, msg: "ID de producto inválido" });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, msg: "Cantidad inválida" });
        }

        // Verificar si el carrito existe
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, msg: "El carrito está vacío" });
        }

        // Buscar si el producto está en el carrito
        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);

        if (productIndex === -1) {
            return res.status(404).json({ success: false, msg: "El producto no está en el carrito" });
        }

        // Reducir la cantidad o eliminar el producto si llega a 0
        if (cart.products[productIndex].quantity > quantity) {
            cart.products[productIndex].quantity -= quantity;
        } else {
            cart.products.splice(productIndex, 1);
        }

        // Si el carrito está vacío después de la eliminación, eliminarlo completamente
        if (cart.products.length === 0) {
            await Cart.findByIdAndDelete(cart._id);
            return res.status(200).json({ success: true, msg: "El carrito ha sido eliminado porque quedó vacío" });
        }


        cart.updatedAt = new Date();
        await cart.save();

        res.status(200).json({ success: true, cart, msg: "Producto eliminado del carrito" });
    } catch (err) {
        console.error("Error al eliminar del carrito:", err);
        res.status(500).json({ success: false, msg: "Error al eliminar del carrito" });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;


        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, msg: "No hay carrito para este usuario" });
        }

        await Cart.findByIdAndDelete(cart._id);

        res.status(200).json({ success: true, msg: "Carrito vaciado exitosamente" });
    } catch (err) {
        console.error("Error al vaciar el carrito:", err);
        res.status(500).json({ success: false, msg: "Error al vaciar el carrito" });
    }
};

const removeProductFromCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId } = req.params;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, msg: "El carrito está vacío" });
        }

        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);

        if (productIndex === -1) {
            return res.status(404).json({ success: false, msg: "El producto no está en el carrito" });
        }

        cart.products.splice(productIndex, 1);

        if (cart.products.length === 0) {
            await Cart.findByIdAndDelete(cart._id);
            return res.status(200).json({ success: true, msg: "El carrito ha sido eliminado porque quedó vacío" });
        }

        cart.updatedAt = new Date();
        await cart.save();

        res.status(200).json({ success: true, msg: "Carrito vaciado exitosamente" });
    } catch (err) {
        console.error("Error al vaciar el carrito:", err);
        res.status(500).json({ success: false, msg: "Error al vaciar el carrito" });
    }
}

const loadCart = async (req, res) => {
    try {
        const userId = req.user._id;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(400).json({ success: false, msg: "El carrito está vacío" });
        }

        res.status(200).json({ success: true, cart, msg: "Se envio correctamente el carrito" });

    } catch (err) {
        console.error("Error al enviar el carrito de compras del usuario: ", err);
        res.status(500).json({ success: false, msg: "Error al enviar el carrito de compras del usuario" });
    }
}



export { addToCart, removeFromCart, clearCart, removeProductFromCart, loadCart };
