import { Order } from '../models/Order.js';
import { OrderDetail } from '../models/OrderDetail.js';
import { Cart } from '../models/Cart.js';
import { ProductoBase } from '../models/Product.js';
import { User } from '../models/User.js';
import { validationResult } from 'express-validator';
import { ShippingMethod } from "../models/ShippingMethod.js";
import { PaymentMethod } from '../models/PaymentMethod.js';
import { Quotation } from '../models/Quotation.js';
import { QuotationDetail } from '../models/QuotationDetail.js';

const createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const userId = req.user._id;
        const { shippingAddressId, paymentMethod, shippingMethod, recipientName, phoneContact, additionalInstructions } = req.body;

        // Obtener el usuario con sus direcciones
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, msg: "Usuario no encontrado" });
        }

        // Verificar que la dirección pertenezca al usuario
        const shippingAddress = user.addresses.id(shippingAddressId);
        if (!shippingAddress) {
            return res.status(404).json({ success: false, msg: "Dirección de envío no encontrada o no pertenece al usuario" });
        }

        // Verificar y obtener el método de pago
        const paymentMethodObject = await PaymentMethod.findById(paymentMethod);
        console.log(`Payment method 1: ${paymentMethod}`);
        if (!paymentMethodObject || !paymentMethodObject.active) {
            return res.status(400).json({ success: false, msg: "Método de pago inválido" });
        }
        console.log(`Payment method: ${paymentMethodObject}`);

        // Verificar y obtener el transportista (carrier)
        const carrier = await ShippingMethod.findById(shippingMethod);
        if (!carrier || !carrier.active) {
            return res.status(404).json({ success: false, msg: "Método de envío inválido" });
        }

        // Seleccionar el primer método de envío por defecto si hay múltiples
        const selectedMethod = carrier.methods.length > 0 ? carrier.methods[0] : null;
        if (!selectedMethod) {
            return res.status(404).json({ success: false, msg: "No hay métodos de envío disponibles para este transportista" });
        }

        // Calcular fecha estimada de entrega (basada en el texto del delivery_time)
        const estimatedDeliveryDate = new Date();
        const deliveryDaysMatch = selectedMethod.delivery_time.match(/(\d+)\s*(?:días|días hábiles|day|days)/);
        let daysToAdd = 7; // Valor por defecto si no se puede determinar
        
        if (deliveryDaysMatch && deliveryDaysMatch[1]) {
            const maxDays = parseInt(deliveryDaysMatch[1], 10);
            daysToAdd = maxDays;
        }
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + daysToAdd);

        // Buscar el carrito del usuario
        const cart = await Cart.findOne({ userId }).populate('products.productId');
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, msg: "El carrito está vacío" });
        }

        // Calcular el subtotal de productos y verificar el stock
        let subtotal = 0;
        let totalWeight = 0;

        for (const item of cart.products) {
            const producto = await ProductoBase.findById(item.productId);
            if (!producto) {
                return res.status(404).json({ success: false, msg: `Producto no encontrado: ${item.productId}` });
            }

            // Verificar stock según el tipo de producto
            if (producto.tipoProducto === 'ProductoCarne') {
                // Para productos de carne, verificamos el stock en kg
                if (producto.inventario.stockUnidades < item.quantity) {
                    return res.status(400).json({ success: false, msg: `Stock insuficiente para el producto: ${producto.nombre}` });
                }
            } else if (producto.tipoProducto === 'ProductoAceite') {
                // Para productos de aceite, verificamos el stock en unidades
                if (producto.inventario.stockUnidades < item.quantity) {
                    return res.status(400).json({ success: false, msg: `Stock insuficiente para el producto: ${producto.nombre}` });
                }
            } else {
                // Para otros tipos de productos, verificamos usando el campo que corresponda
                if ((producto.inventario && producto.inventario.stockUnidades < item.quantity) || producto.estado === false) {
                    return res.status(400).json({ success: false, msg: `Stock insuficiente para el producto: ${producto.nombre}` });
                }
            }

            // Calcular precio según el tipo de producto
            let precioUnitario = producto.precios.base;
            
            // Aplicar descuentos si hay
            if (producto.precios.descuentos && producto.precios.descuentos.regular > 0) {
                const descuento = producto.precios.descuentos.regular / 100;
                precioUnitario = precioUnitario * (1 - descuento);
            }
            
            subtotal += precioUnitario * item.quantity;

            // Calcular peso total si el producto tiene peso
            if (producto.tipoProducto === 'ProductoCarne' && producto.opcionesPeso && producto.opcionesPeso.pesoPromedio) {
                totalWeight += (producto.opcionesPeso.pesoPromedio / 1000) * item.quantity; // Convertir a kg si está en gramos
            }
        }

        // Calcular el costo de envío
        let shippingCost = selectedMethod.base_cost;
        if (totalWeight > 0) {
            shippingCost += (totalWeight * selectedMethod.extra_cost_per_kg);
        }

        // Verificar si aplica envío gratuito basado en el umbral
        if (selectedMethod.free_shipping_threshold && subtotal >= selectedMethod.free_shipping_threshold) {
            shippingCost = 0;
        }

        const subtotalEnvio = subtotal + shippingCost;

        // Calcular comisión del método de pago
        const paymentCommission = (subtotalEnvio * paymentMethodObject.commission_percentage) / 100;
        
        // Calcular el total final
        const total = subtotalEnvio + paymentCommission;


        

        // Crear la orden con el nuevo campo subtotal
        const order = new Order({
            userId,
            orderDate: new Date(),
            status: "pending",
            subtotal, // Agregamos el subtotal de productos
            total,    // Total incluye envío y comisiones
            shippingAddress: {
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                country: shippingAddress.country,
                zipCode: shippingAddress.zipCode,
                reference: shippingAddress.reference || '',
                phoneContact: phoneContact || '', // Campo adicional
                recipientName: recipientName || shippingAddress.recipientName || user.firstName + ' ' + user.lastName,
                additionalInstructions: additionalInstructions || '' // Campo adicional
            },
            paymentMethod: paymentMethod.toString(), 
            payment: {
                status: 'pending', // Estado inicial del pago
                currency: 'CLP',   // Moneda por defecto
                amount: total,
                provider: paymentMethodObject.provider,
                commissionPercentage: paymentMethodObject.commission_percentage,
                commissionAmount: paymentCommission
            },
            shipping: {
                carrier: carrier._id,
                method: selectedMethod.name,
                cost: shippingCost,
                trackingNumber: null // Inicialmente sin número de seguimiento
            },
            estimatedDeliveryDate,
        });

        // Guardar la orden en la base de datos
        await order.save();

        for (const item of cart.products) {
            try {
                const producto = await ProductoBase.findById(item.productId);
                
                // Calcular precio según el tipo de producto
                let precioUnitario = producto.precios.base;
                
                // Aplicar descuentos si hay
                if (producto.precios.descuentos && producto.precios.descuentos.regular > 0) {
                    const descuento = producto.precios.descuentos.regular / 100;
                    precioUnitario = precioUnitario * (1 - descuento);
                }
                
                const orderDetail = new OrderDetail({
                    orderId: order._id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: precioUnitario, // Precio al momento de la compra
                });
                await orderDetail.save();
            } catch (err) {
                console.error("Error al guardar OrderDetail:", err);
            }
        }

        // Reducir el stock de los productos vendidos
        for (const item of cart.products) {
            const producto = await ProductoBase.findById(item.productId);
            
            // Actualizar stock según el tipo de producto
            if (producto.tipoProducto === 'ProductoCarne') {
                await ProductoBase.findByIdAndUpdate(item.productId, { $inc: { 'inventario.stockUnidades': -item.quantity } });
            } else if (producto.tipoProducto === 'ProductoAceite') {
                await ProductoBase.findByIdAndUpdate(item.productId, { $inc: { 'inventario.stockUnidades': -item.quantity } });
            } else {
                // Para otros tipos de productos
                if (producto.inventario && producto.inventario.stockUnidades !== undefined) {
                    await ProductoBase.findByIdAndUpdate(item.productId, { $inc: { 'inventario.stockUnidades': -item.quantity } });
                }
            }
        }

        // Vaciar el carrito del usuario
        await Cart.findByIdAndDelete(cart._id);

        // Poblar la información del transportista en la respuesta
        await order.populate('shipping.carrier');

        // Actualizar la respuesta para incluir el desglose detallado
        res.status(201).json({ 
            success: true, 
            msg: "Orden creada exitosamente", 
            order,
            costBreakdown: {
                subtotal,              // Costo base de productos
                shippingCost,         // Costo de envío
                paymentCommission,    // Comisión del método de pago
                total                 // Total final
            }
        });
    } catch (err) {
        console.error("Error al crear la orden:", err);
        
        // Imprimir detalles adicionales del error de validación si es un error de MongoDB
        if (err.code === 121 && err.errInfo) {
            console.error("Detalle del error de validación:", JSON.stringify(err.errInfo, null, 2));
            if (err.errInfo.details && err.errInfo.details.schemaRulesNotSatisfied) {
                console.error("Reglas de esquema no satisfechas:", JSON.stringify(err.errInfo.details.schemaRulesNotSatisfied, null, 2));
            }
        }
        
        res.status(500).json({ success: false, msg: "Error al crear la orden", error: err.message });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ userId })
            .populate('shipping.carrier')
            .populate('userId', 'firstName lastName email');

        // Obtener los detalles de los productos para cada orden
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const orderDetails = await OrderDetail.find({ orderId: order._id })
                    .populate({
                        path: 'productId',
                        model: 'Producto'
                    });

                return {
                    ...order.toObject(),
                    products: orderDetails.map(detail => ({
                        product: detail.productId,
                        quantity: detail.quantity,
                        price: detail.price
                    }))
                };
            })
        );

        res.status(200).json({ 
            success: true, 
            orders: ordersWithDetails 
        });
    } catch (err) {
        console.error("Error al obtener las órdenes del usuario:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener las órdenes del usuario" 
        });
    }
};

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('shipping.carrier')
            .populate('userId', 'firstName lastName email');

        // Obtener los detalles de los productos para cada orden
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const orderDetails = await OrderDetail.find({ orderId: order._id })
                    .populate({
                        path: 'productId',
                        model: 'Producto'
                    });

                return {
                    ...order.toObject(),
                    products: orderDetails.map(detail => ({
                        product: detail.productId,
                        quantity: detail.quantity,
                        price: detail.price
                    }))
                };
            })
        );

        res.status(200).json({ 
            success: true, 
            orders: ordersWithDetails 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener las órdenes" 
        });
    }
};

const getOrder = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId)
            .populate('shipping.carrier')
            .populate('userId', 'firstName lastName email');
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                msg: "Orden no encontrada" 
            });
        }

        // Verificar si el usuario es admin o es el dueño de la orden
        if (!req.user.roles.includes('admin') && order.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                msg: "No tienes permiso para ver esta orden" 
            });
        }
        
        const orderDetails = await OrderDetail.find({ orderId: order._id })
            .populate({
                path: 'productId',
                model: 'Producto'
            });

        const responseOrder = {
            ...order.toObject(),
            products: orderDetails.map(detail => ({
                product: detail.productId,
                quantity: detail.quantity,
                price: detail.price
            }))
        };
        
        res.status(200).json({ 
            success: true, 
            order: responseOrder 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener la orden" 
        });
    }
};

const updateOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                msg: "Orden no encontrada" 
            });
        }

        // Si se está actualizando el transportista y el método de envío
        if (req.body.shipping) {
            if (req.body.shipping.carrier) {
                const carrier = await ShippingMethod.findById(req.body.shipping.carrier);
                if (!carrier || !carrier.active) {
                    return res.status(404).json({ 
                        success: false, 
                        msg: "Transportista no válido" 
                    });
                }

                // Si también se proporciona el método específico
                if (req.body.shipping.method) {
                    const selectedMethod = carrier.methods.find(m => m.name === req.body.shipping.method);
                    if (!selectedMethod) {
                        return res.status(404).json({ 
                            success: false, 
                            msg: "Método de envío no válido para este transportista" 
                        });
                    }

                    // Actualizar costos y fechas
                    const estimatedDeliveryDate = new Date();
                    const deliveryDaysMatch = selectedMethod.delivery_time.match(/(\d+)\s*(?:días|días hábiles|day|days)/);
                    let daysToAdd = 7;

                    if (deliveryDaysMatch && deliveryDaysMatch[1]) {
                        daysToAdd = parseInt(deliveryDaysMatch[1], 10);
                    }

                    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + daysToAdd);

                    // Si hay un costo de envío en la solicitud, usarlo, si no, usar el costo base del método
                    let shippingCost = req.body.shipping.cost || selectedMethod.base_cost;

                    // Calcular el total de productos
                    const orderDetails = await OrderDetail.find({ orderId: order._id });
                    let productsTotal = 0;
                    for (const detail of orderDetails) {
                        productsTotal += detail.price * detail.quantity;
                    }

                    // Verificar si aplica envío gratuito basado en el umbral
                    if (selectedMethod.free_shipping_threshold && productsTotal >= selectedMethod.free_shipping_threshold) {
                        shippingCost = 0;
                    }

                    // Actualizar la orden con la nueva información de envío
                    order.shipping.carrier = carrier._id;
                    order.shipping.method = selectedMethod.name;
                    order.shipping.cost = shippingCost;
                    order.estimatedDeliveryDate = estimatedDeliveryDate;
                    order.total = productsTotal + shippingCost;
                }
            }

            // Actualizar número de seguimiento si se proporciona
            if (req.body.shipping.trackingNumber !== undefined) {
                order.shipping.trackingNumber = req.body.shipping.trackingNumber;
            }
        }

        // Actualizar otros campos si existen
        if (req.body.status) order.status = req.body.status;
        if (req.body.shippingAddress) order.shippingAddress = req.body.shippingAddress;
        if (req.body.paymentMethod) order.paymentMethod = req.body.paymentMethod;

        await order.save();
        await order.populate('shipping.carrier');

        res.status(200).json({ 
            success: true, 
            msg: "Orden actualizada correctamente",
            order: order 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al actualizar la orden" 
        });
    }
};

const deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                msg: "Orden no encontrada" 
            });
        }
        await order.deleteOne();
        res.status(200).json({ 
            success: true, 
            msg: "Orden eliminada correctamente" 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al eliminar la orden" 
        });
    }
};

const createOrderFromQuotation = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const userId = req.user._id;
        const { quotationId, paymentMethodId } = req.body;

        console.log(`Quotation ID: ${quotationId}`);
        console.log(`Payment Method ID: ${paymentMethodId}`);

        // Obtener y validar la cotización
        const quotation = await Quotation.findById(quotationId)
            .populate('shipping.carrier')
            .populate({
                path: 'userId',
                select: 'firstName lastName email'
            });

        if (!quotation) {
            return res.status(404).json({ success: false, msg: "Cotización no encontrada" });
        }

        // Validar que la cotización pertenezca al usuario
        if (quotation.userId._id.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, msg: "No tienes permiso para usar esta cotización" });
        }

        // Validar el estado de la cotización
        if (quotation.status !== "approved") {
            return res.status(400).json({ success: false, msg: "La cotización debe estar aprobada para crear una orden" });
        }

        // Validar que la cotización no haya expirado
        if (new Date() > new Date(quotation.validUntil)) {
            return res.status(400).json({ success: false, msg: "La cotización ha expirado" });
        }

        // Verificar y obtener el método de pago
        const paymentMethodObject = await PaymentMethod.findById(paymentMethodId);
        if (!paymentMethodObject || !paymentMethodObject.active) {
            return res.status(400).json({ success: false, msg: "Método de pago inválido" });
        }

        // Calcular comisión del método de pago
        const subtotalEnvio = quotation.subtotal + quotation.shipping.cost;
        const paymentCommission = (subtotalEnvio * paymentMethodObject.commission_percentage) / 100;
        const total = subtotalEnvio + paymentCommission;

        // Obtener los detalles de la cotización
        const quotationDetails = await QuotationDetail.find({ quotationId });

        // Crear la orden
        const order = new Order({
            userId: quotation.userId._id,
            orderDate: new Date(),
            status: "pending",
            subtotal: quotation.subtotal,
            total,
            shippingAddress: quotation.shippingAddress,
            paymentMethod: paymentMethodId,
            payment: {
                status: 'pending',
                currency: 'CLP',
                amount: total,
                provider: paymentMethodObject.provider,
                commissionPercentage: paymentMethodObject.commission_percentage,
                commissionAmount: paymentCommission
            },
            shipping: {
                carrier: quotation.shipping.carrier._id,
                method: quotation.shipping.method,
                cost: quotation.shipping.cost,
                trackingNumber: null
            },
            estimatedDeliveryDate: calculateEstimatedDeliveryDate(quotation.shipping.carrier.methods[0])
        });

        await order.save();

        // Crear los detalles de la orden
        for (const detail of quotationDetails) {
            const orderDetail = new OrderDetail({
                orderId: order._id,
                productId: detail.productId,
                quantity: detail.quantity,
                price: detail.price
            });
            await orderDetail.save();

            // Actualizar el stock
            const producto = await ProductoBase.findById(detail.productId);
            if (producto) {
                if (producto.tipoProducto === 'ProductoCarne') {
                    await ProductoBase.findByIdAndUpdate(detail.productId, 
                        { $inc: { 'inventario.stockUnidades': -detail.quantity } });
                } else {
                    await ProductoBase.findByIdAndUpdate(detail.productId, 
                        { $inc: { 'inventario.stockUnidades': -detail.quantity } });
                }
            }
        }

        // Actualizar el estado de la cotización a finalizada y vincularla con la orden
        quotation.status = "finalized";
        quotation.orderId = order._id;
        await quotation.save();

        // Poblar la información completa de la orden
        await order.populate('shipping.carrier');

        res.status(201).json({
            success: true,
            msg: "Orden creada exitosamente desde la cotización",
            order,
            costBreakdown: {
                subtotal: quotation.subtotal,
                shippingCost: quotation.shipping.cost,
                paymentCommission,
                total
            }
        });

    } catch (err) {
        console.error("Error al crear la orden desde la cotización:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error al crear la orden desde la cotización", 
            error: err.message 
        });
    }
};

// Función auxiliar para calcular la fecha estimada de entrega
const calculateEstimatedDeliveryDate = (shippingMethod) => {
    const estimatedDeliveryDate = new Date();
    const deliveryDaysMatch = shippingMethod.delivery_time.match(/(\d+)\s*(?:días|días hábiles|day|days)/);
    let daysToAdd = 7; // Valor por defecto
    
    if (deliveryDaysMatch && deliveryDaysMatch[1]) {
        daysToAdd = parseInt(deliveryDaysMatch[1], 10);
    }
    
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + daysToAdd);
    return estimatedDeliveryDate;
};

const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        // Verificar que el usuario tenga rol de admin
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({
                success: false,
                msg: "No tienes permiso para actualizar el estado de la orden"
            });
        }
        // Validar que el status sea válido
        const validStatuses = ["pending", "completed", "canceled", "finalized"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                msg: "Estado de orden no válido",
                validStatuses
            });
        }

        // Buscar y actualizar la orden
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                msg: "Orden no encontrada"
            });
        }

        // Actualizar el estado
        order.status = status;
        await order.save();

        // Poblar la información necesaria
        await order.populate('shipping.carrier');
        await order.populate('userId', 'firstName lastName email');

        res.status(200).json({
            success: true,
            msg: "Estado de la orden actualizado correctamente",
            order
        });
    } catch (error) {
        console.error("Error al actualizar el estado de la orden:", error);
        res.status(500).json({
            success: false,
            msg: "Error al actualizar el estado de la orden",
            error: error.message
        });
    }
};

export { createOrder, getUserOrders, getOrders, getOrder, updateOrder, deleteOrder, createOrderFromQuotation, updateOrderStatus };