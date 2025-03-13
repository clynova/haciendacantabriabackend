import { Order } from '../models/Order.js';
import { OrderDetail } from '../models/OrderDetail.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { validationResult } from 'express-validator';
import { ShippingMethod } from "../models/ShippingMethod.js";
import { PaymentMethod } from '../models/PaymentMethod.js';

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
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ success: false, msg: `Producto no encontrado: ${item.productId}` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, msg: `Stock insuficiente para el producto: ${product.name}` });
            }
            subtotal += product.price * item.quantity;

            if (product.weight) {
                totalWeight += product.weight * item.quantity;
            }
        }

        // Calcular el costo de envío
        let shippingCost = selectedMethod.base_cost;
        if (totalWeight > 0) {
            shippingCost += (totalWeight * selectedMethod.extra_cost_per_kg);
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
                const product = await Product.findById(item.productId);
                const orderDetail = new OrderDetail({
                    orderId: order._id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price, // Precio al momento de la compra
                });
                await orderDetail.save();
            } catch (err) {
                console.error("Error al guardar OrderDetail:", err);
            }
        }

        // Reducir el stock de los productos vendidos
        for (const item of cart.products) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
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
        // Obtener las órdenes del usuario
        const orders = await Order.find({ userId }).populate('shipping.carrier');

        // Obtener los detalles de los productos para cada orden
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const orderDetails = await OrderDetail.find({ orderId: order._id }).populate('productId');
                return {
                    ...order.toObject(), // Convertir el documento de Mongoose a un objeto plano
                    products: orderDetails.map(detail => ({
                        productId: detail.productId,
                        quantity: detail.quantity,
                        price: detail.price,
                    })),
                };
            })
        );

        res.status(200).json({ success: true, orders: ordersWithDetails });
    } catch (err) {
        console.error("Error al obtener las órdenes del usuario:", err);
        res.status(500).json({ success: false, msg: "Error al obtener las órdenes del usuario" });
    }
};

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('shipping.carrier')
            .populate('userId', 'name email');

        res.status(200).json({ 
            success: true, 
            orders: orders 
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
            .populate('userId', 'name email');
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                msg: "Orden no encontrada" 
            });
        }
        
        // Obtener detalles de la orden
        const orderDetails = await OrderDetail.find({ orderId: order._id }).populate('productId');
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
                    const shippingCost = req.body.shipping.cost || selectedMethod.base_cost;

                    // Actualizar la orden con la nueva información de envío
                    order.shipping.carrier = carrier._id;
                    order.shipping.method = selectedMethod.name;
                    order.shipping.cost = shippingCost;
                    order.estimatedDeliveryDate = estimatedDeliveryDate;

                    // Recalcular el total de la orden
                    const orderDetails = await OrderDetail.find({ orderId: order._id });
                    let productsTotal = 0;
                    for (const detail of orderDetails) {
                        productsTotal += detail.price * detail.quantity;
                    }

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

export { createOrder, getUserOrders, getOrders, getOrder, updateOrder, deleteOrder };