import { Cart } from '../models/Cart.js';
import { ProductoBase } from "../models/Product.js";
import mongoose from 'mongoose';

const addToCart = async (req, res) => {
    try {
        let { productId, quantity, variantId } = req.body;
        const userId = req.user._id;

        // Validaciones básicas
        if (!Number.isInteger(quantity) || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(200).json({ success: true, msg: "Cargando datos" });
        }
        
        // Validar el ID del producto
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, msg: "ID de producto inválido" });
        }

        // Validar la cantidad
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, msg: "Cantidad inválida" });
        }

        // Verificar si el producto existe y está activo
        const product = await ProductoBase.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, msg: "Producto no encontrado" });
        }

        // Verificar si el producto está activo
        if (!product.estado) {
            return res.status(400).json({ success: false, msg: "Este producto no está disponible actualmente" });
        }

        // Buscar la variante específica del producto
        if (!variantId) {
            return res.status(400).json({ success: false, msg: "Debe seleccionar una variante de peso" });
        }

        // Encontrar la variante seleccionada
        const selectedVariant = product.opcionesPeso.pesosEstandar.id(variantId);
        if (!selectedVariant) {
            return res.status(404).json({ success: false, msg: "Variante de peso no encontrada" });
        }

        // Verificar stock de la variante específica
        if (selectedVariant.stockDisponible < quantity) {
            return res.status(400).json({ success: false, msg: "Stock insuficiente para la variante seleccionada" });
        }

        // Buscar el carrito del usuario
        let cart = await Cart.findOne({ userId });

        // Preparar objeto de variante para guardar en el carrito
        const variantInfo = {
            pesoId: selectedVariant._id,
            peso: selectedVariant.peso,
            unidad: selectedVariant.unidad,
            precio: selectedVariant.precio,
            sku: selectedVariant.sku
        };

        if (!cart) {
            // Si no existe, crear un nuevo carrito con el producto y su variante
            cart = new Cart({
                userId,
                products: [{
                    productId,
                    quantity,
                    variant: variantInfo
                }],
            });
        } else {
            // Buscar si el producto con la misma variante ya está en el carrito
            const productIndex = cart.products.findIndex(p => 
                p.productId.toString() === productId && 
                p.variant.pesoId.toString() === variantId.toString()
            );

            if (productIndex > -1) {
                // Si el producto con esa variante ya está en el carrito, incrementar la cantidad
                cart.products[productIndex].quantity += quantity;
            } else {
                // Si el producto o la variante no está en el carrito, agregarlo
                cart.products.push({
                    productId,
                    quantity,
                    variant: variantInfo
                });
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
        const { quantity, variantId } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, msg: "ID de producto inválido" });
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, msg: "Cantidad inválida" });
        }

        if (!variantId) {
            return res.status(400).json({ success: false, msg: "Debe especificar la variante a remover" });
        }

        // Verificar si el carrito existe
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, msg: "El carrito está vacío" });
        }

        // Buscar si el producto con la variante específica está en el carrito
        const productIndex = cart.products.findIndex(p => 
            p.productId.toString() === productId && 
            p.variant.pesoId.toString() === variantId.toString()
        );

        if (productIndex === -1) {
            return res.status(404).json({ success: false, msg: "El producto con esa variante no está en el carrito" });
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
        const { variantId } = req.query;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, msg: "El carrito está vacío" });
        }

        // Si se proporciona variantId, eliminar solo esa variante específica
        if (variantId) {
            const productIndex = cart.products.findIndex(p => 
                p.productId.toString() === productId && 
                p.variant.pesoId.toString() === variantId
            );

            if (productIndex === -1) {
                return res.status(404).json({ success: false, msg: "El producto con esa variante no está en el carrito" });
            }

            cart.products.splice(productIndex, 1);
        } else {
            // Eliminar todas las variantes de este producto
            cart.products = cart.products.filter(p => p.productId.toString() !== productId);
        }

        if (cart.products.length === 0) {
            await Cart.findByIdAndDelete(cart._id);
            return res.status(200).json({ success: true, msg: "El carrito ha sido eliminado porque quedó vacío" });
        }

        cart.updatedAt = new Date();
        await cart.save();

        res.status(200).json({ success: true, cart, msg: "Producto eliminado del carrito exitosamente" });
    } catch (err) {
        console.error("Error al eliminar producto del carrito:", err);
        res.status(500).json({ success: false, msg: "Error al eliminar producto del carrito" });
    }
}

const loadCart = async (req, res) => {
    try {
        const userId = req.user._id;

        let cart = await Cart.findOne({ userId })
            .populate({
                path: 'products.productId',
                model: ProductoBase,
                select: 'nombre codigo sku categoria estado precios multimedia tipoProducto infoCarne infoAceite slug opcionesPeso'
            });

        if (!cart) {
            return res.status(200).json({ success: true, msg: "El carrito está vacío" });
        }

        // Filtrar productos que ya no están activos o disponibles
        cart.products = cart.products.filter(item => 
            item.productId && item.productId.estado
        );

        // Verificar stock actual para cada producto y su variante
        for (const item of cart.products) {
            if (item.productId) {
                const product = item.productId;
                const variantId = item.variant.pesoId;
                
                // Buscar la variante actual en el producto
                let currentVariant = null;
                
                if (product.opcionesPeso && product.opcionesPeso.pesosEstandar) {
                    currentVariant = product.opcionesPeso.pesosEstandar.find(
                        v => v._id.toString() === variantId.toString()
                    );
                }
                
                // Si la variante ya no existe o no tiene stock suficiente, ajustar la cantidad
                if (!currentVariant || currentVariant.stockDisponible < item.quantity) {
                    if (!currentVariant) {
                        item.unavailable = true;
                        item.unavailableReason = "Variante no disponible";
                    } else if (currentVariant.stockDisponible < item.quantity) {
                        item.quantity = currentVariant.stockDisponible;
                        item.adjustedQuantity = true;
                        
                        if (currentVariant.stockDisponible === 0) {
                            item.unavailable = true;
                            item.unavailableReason = "Sin stock";
                        }
                    }
                }
            }
        }

        // Filtrar los productos que ya no están disponibles
        const unavailableProducts = cart.products.filter(item => item.unavailable);
        cart.products = cart.products.filter(item => !item.unavailable);

        // Si se eliminaron productos, actualizar el carrito
        if (cart.products.length === 0) {
            await Cart.findByIdAndDelete(cart._id);
            return res.status(200).json({ 
                success: true, 
                msg: "El carrito está vacío",
                unavailableProducts: unavailableProducts.length > 0 ? unavailableProducts : undefined
            });
        }

        await cart.save();

        res.status(200).json({ 
            success: true, 
            cart, 
            msg: "Se envió correctamente el carrito",
            unavailableProducts: unavailableProducts.length > 0 ? unavailableProducts : undefined,
            adjustedItems: cart.products.some(item => item.adjustedQuantity)
        });

    } catch (err) {
        console.error("Error al enviar el carrito de compras del usuario: ", err);
        res.status(500).json({ success: false, msg: "Error al enviar el carrito de compras del usuario" });
    }
}

const updateProductQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity, variantId, action } = req.body;
        const userId = req.user._id;

        // Validar el ID del producto
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, msg: "ID de producto inválido" });
        }

        // Validar la acción (increment/decrement/set)
        if (!action || !['increment', 'decrement', 'set'].includes(action)) {
            return res.status(400).json({ success: false, msg: "Acción inválida. Debe ser 'increment', 'decrement' o 'set'" });
        }

        // Validar cantidad
        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, msg: "Cantidad inválida" });
        }

        // Validar variantId
        if (!variantId) {
            return res.status(400).json({ success: false, msg: "Debe especificar la variante del producto" });
        }

        // Buscar el carrito del usuario
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, msg: "Carrito no encontrado" });
        }

        // Buscar el producto y su variante en el carrito
        const productIndex = cart.products.findIndex(p => 
            p.productId.toString() === productId && 
            p.variant.pesoId.toString() === variantId
        );

        if (productIndex === -1) {
            return res.status(404).json({ success: false, msg: "Producto no encontrado en el carrito" });
        }

        // Obtener el producto actual para verificar stock
        const product = await ProductoBase.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, msg: "Producto no encontrado en la base de datos" });
        }

        // Encontrar la variante seleccionada
        const selectedVariant = product.opcionesPeso.pesosEstandar.id(variantId);
        if (!selectedVariant) {
            return res.status(404).json({ success: false, msg: "Variante de peso no encontrada" });
        }

        let newQuantity;
        if (action === 'increment') {
            newQuantity = cart.products[productIndex].quantity + quantity;
            
            // Verificar si hay suficiente stock
            if (newQuantity > selectedVariant.stockDisponible) {
                return res.status(400).json({ 
                    success: false, 
                    msg: "Stock insuficiente",
                    availableStock: selectedVariant.stockDisponible 
                });
            }
            
            cart.products[productIndex].quantity = newQuantity;
        } else if (action === 'decrement') {
            newQuantity = cart.products[productIndex].quantity - quantity;
            
            // Si la nueva cantidad es 0 o menor, eliminar el producto del carrito
            if (newQuantity <= 0) {
                cart.products.splice(productIndex, 1);
                
                // Si el carrito queda vacío, eliminarlo
                if (cart.products.length === 0) {
                    await Cart.findByIdAndDelete(cart._id);
                    return res.status(200).json({ 
                        success: true, 
                        msg: "Producto eliminado y carrito vacío",
                        cart: null
                    });
                }
            } else {
                cart.products[productIndex].quantity = newQuantity;
            }
        } else if (action === 'set') {
            // Verificar si hay suficiente stock para la cantidad solicitada
            if (quantity > selectedVariant.stockDisponible) {
                return res.status(400).json({ 
                    success: false, 
                    msg: "Stock insuficiente para la cantidad solicitada",
                    availableStock: selectedVariant.stockDisponible 
                });
            }
            
            // Actualizar con la cantidad exacta especificada
            cart.products[productIndex].quantity = quantity;
        }

        // Actualizar la fecha de modificación y guardar el carrito
        cart.updatedAt = new Date();
        await cart.save();

        let actionMsg;
        switch (action) {
            case 'increment':
                actionMsg = 'aumentada';
                break;
            case 'decrement':
                actionMsg = 'disminuida';
                break;
            case 'set':
                actionMsg = 'actualizada';
                break;
        }

        res.status(200).json({ 
            success: true, 
            cart,
            msg: `Cantidad ${actionMsg} exitosamente`
        });

    } catch (err) {
        console.error("Error al actualizar la cantidad del producto:", err);
        res.status(500).json({ success: false, msg: "Error al actualizar la cantidad del producto" });
    }
};

export { addToCart, removeFromCart, clearCart, removeProductFromCart, loadCart, updateProductQuantity };
