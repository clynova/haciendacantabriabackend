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
import { enviarEmailConfirmacionOrden } from './emailController.js';

const createOrder = async (req, res) => {
    try {
        // Validar los datos de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const userId = req.user._id;
        const { 
            shippingAddressId, 
            paymentMethod, 
            shippingMethod, 
            recipientName, 
            phoneContact, 
            additionalInstructions,
            facturacion
        } = req.body;

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
        if (!paymentMethodObject || !paymentMethodObject.active) {
            return res.status(400).json({ success: false, msg: "Método de pago inválido" });
        }

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
        
        // Array para almacenar detalles de validación de productos
        const productsToProcess = [];

        // Validar productos y stock
        for (const item of cart.products) {
            const producto = await ProductoBase.findById(item.productId);
            if (!producto) {
                return res.status(404).json({ 
                    success: false, 
                    msg: `Producto no encontrado: ${item.productId}` 
                });
            }

            // Verificar que el producto esté activo
            if (!producto.estado) {
                return res.status(400).json({ 
                    success: false, 
                    msg: `El producto ${producto.nombre} no está disponible actualmente` 
                });
            }

            // Encontrar la variante de peso seleccionada
            const selectedVariant = producto.opcionesPeso.pesosEstandar.find(
                v => v._id.toString() === item.variant.pesoId.toString()
            );

            if (!selectedVariant) {
                return res.status(404).json({ 
                    success: false, 
                    msg: `Variante de peso no encontrada para el producto: ${producto.nombre}` 
                });
            }

            // Verificar stock
            if (selectedVariant.stockDisponible < item.quantity) {
                return res.status(400).json({
                    success: false,
                    msg: `Stock insuficiente para ${producto.nombre} (${selectedVariant.peso} ${selectedVariant.unidad}). Disponible: ${selectedVariant.stockDisponible}, Solicitado: ${item.quantity}`
                });
            }

            // Calcular precio
            const basePrice = selectedVariant.precio;
            const discountPercentage = selectedVariant.descuentos?.regular || 0;
            const finalPrice = basePrice * (1 - (discountPercentage / 100));
            const itemSubtotal = finalPrice * item.quantity;
            
            // Acumular al subtotal general
            subtotal += itemSubtotal;

            // Calcular peso total (solo si es un producto con peso físico)
            if (producto.opcionesPeso && producto.opcionesPeso.pesoPromedio) {
                // Convertir a kg si está en gramos
                const pesoEnKg = selectedVariant.unidad === 'g' 
                    ? (selectedVariant.peso / 1000) * item.quantity
                    : selectedVariant.peso * item.quantity;
                
                totalWeight += pesoEnKg;
            }

            // Guardar información del producto para procesar después
            productsToProcess.push({
                producto,
                selectedVariant,
                quantity: item.quantity,
                basePrice,
                discountPercentage,
                finalPrice,
                itemSubtotal
            });
        }

        // Calcular el costo de envío
        let shippingCost = selectedMethod.base_cost;
        if (totalWeight > 0 && selectedMethod.extra_cost_per_kg) {
            shippingCost += (totalWeight * selectedMethod.extra_cost_per_kg);
        }

        // Verificar si aplica envío gratuito basado en el umbral
        if (selectedMethod.free_shipping_threshold && subtotal >= selectedMethod.free_shipping_threshold) {
            shippingCost = 0;
        }

        const subtotalConEnvio = subtotal + shippingCost;

        // Calcular comisión del método de pago
        const paymentCommission = (subtotalConEnvio * paymentMethodObject.commission_percentage) / 100;
        
        // Calcular el total final
        const total = subtotalConEnvio + paymentCommission;

        // Crear la orden
        const order = new Order({
            userId,
            orderDate: new Date(),
            status: "pending",
            subtotal,
            shippingCost,
            paymentCommission,
            total,
            shippingAddress: {
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                country: shippingAddress.country,
                zipCode: shippingAddress.zipCode,
                reference: shippingAddress.reference || '',
                phoneContact: phoneContact || '',
                recipientName: recipientName || shippingAddress.recipientName || `${user.firstName} ${user.lastName}`,
                additionalInstructions: additionalInstructions || ''
            },
            paymentMethod,
            payment: {
                status: 'pending',
                currency: 'CLP',
                amount: total,
                provider: paymentMethodObject.provider,
                commissionPercentage: paymentMethodObject.commission_percentage,
                commissionAmount: paymentCommission
            },
            shipping: {
                carrier: carrier._id,
                method: selectedMethod.name,
                cost: shippingCost,
                trackingNumber: null
            },
            estimatedDeliveryDate,
            facturacion: {
                comprobanteTipo: facturacion?.comprobanteTipo || 'boleta',
                razonSocial: facturacion?.razonSocial || null,
                rut: facturacion?.rut || null,
                giro: facturacion?.giro || null,
                direccionFacturacion: facturacion?.direccionFacturacion || null
            }
        });

        // Guardar la orden
        await order.save();

        // Crear los detalles de la orden y reducir el stock
        for (const item of productsToProcess) {
            // Crear el detalle de orden
            const orderDetail = new OrderDetail({
                orderId: order._id,
                productId: item.producto._id,
                quantity: item.quantity,
                variant: {
                    pesoId: item.selectedVariant._id,
                    peso: item.selectedVariant.peso,
                    unidad: item.selectedVariant.unidad,
                    sku: item.selectedVariant.sku || item.producto.sku
                },
                priceInfo: {
                    basePrice: item.basePrice,
                    discountPercentage: item.discountPercentage,
                    finalPrice: item.finalPrice
                },
                subtotal: item.itemSubtotal,
                productSnapshot: {
                    nombre: item.producto.nombre,
                    categoria: item.producto.categoria,
                    tipoProducto: item.producto.tipoProducto,
                    imagen: item.producto.multimedia?.imagenes?.find(img => img.esPrincipal)?.url || 
                            (item.producto.multimedia?.imagenes?.length > 0 ? item.producto.multimedia.imagenes[0].url : null)
                }
            });
            
            await orderDetail.save();

            // Reducir el stock
            await ProductoBase.findOneAndUpdate(
                { _id: item.producto._id, "opcionesPeso.pesosEstandar._id": item.selectedVariant._id },
                { $inc: { "opcionesPeso.pesosEstandar.$.stockDisponible": -item.quantity } }
            );
        }

        // Vaciar el carrito del usuario
        await Cart.findByIdAndDelete(cart._id);

        // Cargar referencias para la respuesta
        await order.populate('shipping.carrier');
        await order.populate('paymentMethod');

        // Enviar confirmación por email
        try {
            await enviarEmailConfirmacionOrden(order._id);
        } catch (emailError) {
            console.error("Error al enviar email de confirmación:", emailError);
            // No fallamos la creación de la orden si falla el email
        }

        // Responder con la orden creada
        res.status(201).json({ 
            success: true, 
            msg: "Orden creada exitosamente", 
            order,
            costBreakdown: {
                subtotal,
                shippingCost,
                paymentCommission,
                total
            }
        });

    } catch (err) {
        console.error("Error al crear la orden:", err);
        res.status(500).json({ success: false, msg: "Error al crear la orden", error: err.message });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Obtener todas las órdenes del usuario con sus detalles en una sola consulta
        const orders = await Order.find({ userId })
            .populate('shipping.carrier')
            .populate('paymentMethod')
            .populate('details')
            .sort({ orderDate: -1 }); // Ordenar por fecha, más recientes primero

        // Para cada orden, obtener los detalles de producto
        const ordersWithProductDetails = await Promise.all(
            orders.map(async (order) => {
                // Para cada detalle, buscar el producto actual (puede haber cambiado desde la compra)
                const orderObj = order.toObject();
                
                // Si no hay detalles, usar una consulta separada (por si el virtual no funcionó)
                if (!orderObj.details || orderObj.details.length === 0) {
                    orderObj.details = await OrderDetail.find({ orderId: order._id });
                }

                // Obtener productos actuales para mostrar información actualizada si es necesario
                const productIds = orderObj.details.map(detail => detail.productId);
                const currentProducts = await ProductoBase.find({ _id: { $in: productIds } })
                    .select('nombre estado multimedia.imagenes');
                
                // Crear un mapa para acceso rápido
                const productsMap = new Map();
                currentProducts.forEach(product => {
                    productsMap.set(product._id.toString(), product);
                });

                // Agregar información actual del producto a cada detalle
                orderObj.details = orderObj.details.map(detail => {
                    const currentProduct = productsMap.get(detail.productId.toString());
                    return {
                        ...detail,
                        currentProduct: currentProduct ? {
                            nombre: currentProduct.nombre,
                            disponible: currentProduct.estado,
                            imagen: currentProduct.multimedia?.imagenes?.find(img => img.esPrincipal)?.url ||
                                    (currentProduct.multimedia?.imagenes?.length > 0 ? currentProduct.multimedia.imagenes[0].url : null)
                        } : null
                    };
                });

                return orderObj;
            })
        );

        res.status(200).json({ 
            success: true, 
            orders: ordersWithProductDetails
        });
    } catch (err) {
        console.error("Error al obtener las órdenes del usuario:", err);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener las órdenes del usuario",
            error: err.message
        });
    }
};

const getOrders = async (req, res) => {
    try {
        // Paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtros
        const filterOptions = {};
        
        if (req.query.status) {
            filterOptions.status = req.query.status;
        }
        
        if (req.query.fromDate && req.query.toDate) {
            filterOptions.orderDate = {
                $gte: new Date(req.query.fromDate),
                $lte: new Date(req.query.toDate)
            };
        } else if (req.query.fromDate) {
            filterOptions.orderDate = { $gte: new Date(req.query.fromDate) };
        } else if (req.query.toDate) {
            filterOptions.orderDate = { $lte: new Date(req.query.toDate) };
        }

        // Contar total de documentos para la paginación
        const totalOrders = await Order.countDocuments(filterOptions);
        
        // Obtener órdenes con paginación y filtros
        const orders = await Order.find(filterOptions)
            .populate('userId', 'firstName lastName email')
            .populate('shipping.carrier')
            .populate('paymentMethod')
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        // Obtener detalles para todas las órdenes
        const orderIds = orders.map(order => order._id);
        const allOrderDetails = await OrderDetail.find({ orderId: { $in: orderIds } });
        
        // Agrupar detalles por orderId para acceso rápido
        const detailsByOrderId = new Map();
        allOrderDetails.forEach(detail => {
            const orderId = detail.orderId.toString();
            if (!detailsByOrderId.has(orderId)) {
                detailsByOrderId.set(orderId, []);
            }
            detailsByOrderId.get(orderId).push(detail);
        });

        // Agregar detalles a cada orden
        const ordersWithDetails = orders.map(order => {
            const orderObj = order.toObject();
            orderObj.details = detailsByOrderId.get(order._id.toString()) || [];
            return orderObj;
        });

        res.status(200).json({ 
            success: true, 
            orders: ordersWithDetails,
            pagination: {
                total: totalOrders,
                page,
                limit,
                pages: Math.ceil(totalOrders / limit)
            }
        });
    } catch (error) {
        console.error("Error al obtener las órdenes:", error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener las órdenes",
            error: error.message
        });
    }
};

const getOrder = async (req, res) => {
    const { orderId } = req.params;
    try {
        // Buscar la orden
        const order = await Order.findById(orderId)
            .populate('userId', 'firstName lastName email')
            .populate('shipping.carrier')
            .populate('paymentMethod');
        
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
        
        // Obtener los detalles de la orden
        const orderDetails = await OrderDetail.find({ orderId: order._id });

        // Obtener productos actuales para información adicional
        const productIds = orderDetails.map(detail => detail.productId);
        const currentProducts = await ProductoBase.find({ _id: { $in: productIds } })
            .select('nombre estado');
        
        // Crear mapa para acceso rápido
        const productsMap = new Map();
        currentProducts.forEach(product => {
            productsMap.set(product._id.toString(), product);
        });

        // Agregar información del producto actual a cada detalle
        const detailsWithCurrentProductInfo = orderDetails.map(detail => {
            const detailObj = detail.toObject();
            const currentProduct = productsMap.get(detail.productId.toString());
            
            if (currentProduct) {
                detailObj.currentProductInfo = {
                    nombre: currentProduct.nombre,
                    disponible: currentProduct.estado
                };
            }
            
            return detailObj;
        });

        // Construir objeto de respuesta
        const responseOrder = {
            ...order.toObject(),
            details: detailsWithCurrentProductInfo
        };
        
        res.status(200).json({ 
            success: true, 
            order: responseOrder 
        });
    } catch (error) {
        console.error("Error al obtener la orden:", error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener la orden",
            error: error.message
        });
    }
};

const updateOrder = async (req, res) => {
    const { id } = req.params;
    try {
        // Buscar la orden
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                msg: "Orden no encontrada" 
            });
        }

        // Actualizar campos básicos si se proporcionan
        if (req.body.status) order.status = req.body.status;
        if (req.body.notes) order.notes = req.body.notes;
        
        // Actualizar facturación si se proporciona
        if (req.body.facturacion) {
            if (req.body.facturacion.comprobanteTipo) order.facturacion.comprobanteTipo = req.body.facturacion.comprobanteTipo;
            if (req.body.facturacion.razonSocial) order.facturacion.razonSocial = req.body.facturacion.razonSocial;
            if (req.body.facturacion.rut) order.facturacion.rut = req.body.facturacion.rut;
            if (req.body.facturacion.giro) order.facturacion.giro = req.body.facturacion.giro;
            if (req.body.facturacion.direccionFacturacion) order.facturacion.direccionFacturacion = req.body.facturacion.direccionFacturacion;
        }
        
        // Para mantener compatibilidad con código anterior
        if (req.body.comprobanteTipo && !req.body.facturacion) {
            order.facturacion.comprobanteTipo = req.body.comprobanteTipo;
        }
        if (req.body.rut && !req.body.facturacion) {
            order.facturacion.rut = req.body.rut;
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

                    // Actualizar fecha estimada de entrega
                    const estimatedDeliveryDate = new Date();
                    const deliveryDaysMatch = selectedMethod.delivery_time.match(/(\d+)\s*(?:días|días hábiles|day|days)/);
                    let daysToAdd = 7;

                    if (deliveryDaysMatch && deliveryDaysMatch[1]) {
                        daysToAdd = parseInt(deliveryDaysMatch[1], 10);
                    }

                    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + daysToAdd);

                    // Si hay un costo de envío en la solicitud, usarlo, si no, calcular
                    const shippingCost = req.body.shipping.cost !== undefined ? 
                        req.body.shipping.cost : selectedMethod.base_cost;

                    // Actualizar la orden con la nueva información de envío
                    order.shipping.carrier = carrier._id;
                    order.shipping.method = selectedMethod.name;
                    order.shipping.cost = shippingCost;
                    order.estimatedDeliveryDate = estimatedDeliveryDate;
                    
                    // Recalcular el total
                    order.shippingCost = shippingCost;
                    order.total = order.subtotal + order.shippingCost + order.paymentCommission;
                }
            }

            // Actualizar número de seguimiento si se proporciona
            if (req.body.shipping.trackingNumber !== undefined) {
                order.shipping.trackingNumber = req.body.shipping.trackingNumber;
            }
        }

        // Actualizar estado del pago si se proporciona
        if (req.body.payment?.status) {
            order.payment.status = req.body.payment.status;
        }

        // Guardar los cambios
        await order.save();
        
        // Cargar referencias para la respuesta
        await order.populate('shipping.carrier');
        await order.populate('paymentMethod');
        
        // Obtener detalles para la respuesta
        const details = await OrderDetail.find({ orderId: order._id });

        res.status(200).json({ 
            success: true, 
            msg: "Orden actualizada correctamente",
            order: {
                ...order.toObject(),
                details
            }
        });
    } catch (error) {
        console.error("Error al actualizar la orden:", error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al actualizar la orden",
            error: error.message
        });
    }
};

const deleteOrder = async (req, res) => {
    const { id } = req.params;
    try {
        // Solo los administradores pueden eliminar órdenes
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({
                success: false,
                msg: "No tienes permiso para eliminar órdenes"
            });
        }

        // Buscar la orden
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                msg: "Orden no encontrada" 
            });
        }

        // Eliminar los detalles de la orden primero
        await OrderDetail.deleteMany({ orderId: id });
        
        // Luego eliminar la orden
        await order.deleteOne();
        
        res.status(200).json({ 
            success: true, 
            msg: "Orden y sus detalles eliminados correctamente" 
        });
    } catch (error) {
        console.error("Error al eliminar la orden:", error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al eliminar la orden",
            error: error.message
        });
    }
};

const createOrderFromQuotation = async (req, res) => {
    try {
        // Validar los datos de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const userId = req.user._id;
        const { quotationId, paymentMethodId, facturacion } = req.body;
        
        // Para compatibilidad con código anterior
        const comprobanteTipo = req.body.comprobanteTipo;
        const rut = req.body.rut;

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
        const subtotalConEnvio = quotation.subtotal + quotation.shipping.cost;
        const paymentCommission = (subtotalConEnvio * paymentMethodObject.commission_percentage) / 100;
        const total = subtotalConEnvio + paymentCommission;

        // Obtener los detalles de la cotización
        const quotationDetails = await QuotationDetail.find({ quotationId }).populate('productId');

        // Verificar stock de todos los productos
        for (const detail of quotationDetails) {
            const producto = detail.productId;
            
            if (!producto) {
                return res.status(404).json({ 
                    success: false, 
                    msg: `Producto no encontrado: ${detail.productId}` 
                });
            }

            // Verificar que esté activo
            if (!producto.estado) {
                return res.status(400).json({ 
                    success: false, 
                    msg: `El producto ${producto.nombre} ya no está disponible` 
                });
            }

            // Verificar stock
            const selectedVariant = producto.opcionesPeso.pesosEstandar.find(
                v => v._id.toString() === detail.variant.pesoId.toString()
            );

            if (!selectedVariant) {
                return res.status(404).json({ 
                    success: false, 
                    msg: `Variante de peso no encontrada para el producto: ${producto.nombre}` 
                });
            }

            if (selectedVariant.stockDisponible < detail.quantity) {
                return res.status(400).json({
                    success: false,
                    msg: `Stock insuficiente para ${producto.nombre} (${selectedVariant.peso} ${selectedVariant.unidad}). Disponible: ${selectedVariant.stockDisponible}, Solicitado: ${detail.quantity}`
                });
            }
        }

        // Obtener la fecha estimada de entrega
        const estimatedDeliveryDate = calculateEstimatedDeliveryDate(
            quotation.shipping.carrier.methods.find(m => m.name === quotation.shipping.method) || 
            quotation.shipping.carrier.methods[0]
        );

        // Crear la orden
        const order = new Order({
            userId: quotation.userId._id,
            orderDate: new Date(),
            status: "pending",
            subtotal: quotation.subtotal,
            shippingCost: quotation.shipping.cost,
            paymentCommission: paymentCommission,
            total: total,
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
            estimatedDeliveryDate: estimatedDeliveryDate,
            quotationId: quotation._id,
            facturacion: {
                comprobanteTipo: facturacion?.comprobanteTipo || comprobanteTipo || 'boleta',
                razonSocial: facturacion?.razonSocial || null,
                rut: facturacion?.rut || rut || null,
                giro: facturacion?.giro || null,
                direccionFacturacion: facturacion?.direccionFacturacion || null
            }
        });

        await order.save();

        // Crear los detalles de la orden y reducir el stock
        for (const detail of quotationDetails) {
            const producto = detail.productId;
            
            // Encontrar la variante seleccionada
            const selectedVariant = producto.opcionesPeso.pesosEstandar.find(
                v => v._id.toString() === detail.variant.pesoId.toString()
            );
            
            // Calcular los precios correctamente para el OrderDetail
            const basePrice = selectedVariant.precio || detail.variant.precio;
            const discountPercentage = selectedVariant.descuentos?.regular || 0;
            const finalPrice = basePrice * (1 - (discountPercentage / 100));
            const itemSubtotal = finalPrice * detail.quantity;

            // Crear el detalle de orden con la estructura actual
            const orderDetail = new OrderDetail({
                orderId: order._id,
                productId: producto._id,
                quantity: detail.quantity,
                variant: {
                    pesoId: selectedVariant._id,
                    peso: selectedVariant.peso,
                    unidad: selectedVariant.unidad,
                    sku: selectedVariant.sku || producto.sku
                },
                priceInfo: {
                    basePrice: basePrice,
                    discountPercentage: discountPercentage,
                    finalPrice: finalPrice
                },
                subtotal: itemSubtotal,
                productSnapshot: {
                    nombre: producto.nombre,
                    categoria: producto.categoria,
                    tipoProducto: producto.tipoProducto,
                    imagen: producto.multimedia?.imagenes?.find(img => img.esPrincipal)?.url || 
                            (producto.multimedia?.imagenes?.length > 0 ? producto.multimedia.imagenes[0].url : null)
                }
            });
            
            await orderDetail.save();

            // Reducir el stock
            await ProductoBase.findOneAndUpdate(
                { _id: producto._id, "opcionesPeso.pesosEstandar._id": selectedVariant._id },
                { $inc: { "opcionesPeso.pesosEstandar.$.stockDisponible": -detail.quantity } }
            );
        }

        // Actualizar el estado de la cotización a finalizada y vincularla con la orden
        quotation.status = "finalized";
        quotation.orderId = order._id;
        await quotation.save();

        // Cargar las referencias para la respuesta
        await order.populate('shipping.carrier');
        await order.populate('paymentMethod');

        // Enviar email de confirmación
        try {
            await enviarEmailConfirmacionOrden(order._id);
        } catch (emailError) {
            console.error("Error al enviar email de confirmación:", emailError);
            // No fallamos la creación de la orden si falla el email
        }

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
        const validStatuses = ["pending", "processing", "completed", "canceled", "finalized"];
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
        await order.populate('paymentMethod');
        await order.populate('userId', 'firstName lastName email');

        // Obtener detalles de la orden
        const details = await OrderDetail.find({ orderId: order._id });

        res.status(200).json({
            success: true,
            msg: "Estado de la orden actualizado correctamente",
            order: {
                ...order.toObject(),
                details
            }
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

export { 
    createOrder, 
    getUserOrders, 
    getOrders, 
    getOrder, 
    updateOrder, 
    deleteOrder, 
    createOrderFromQuotation, 
    updateOrderStatus 
};