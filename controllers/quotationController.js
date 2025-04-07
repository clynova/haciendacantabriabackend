import { Quotation } from '../models/Quotation.js';
import { QuotationDetail } from '../models/QuotationDetail.js';
import { Cart } from '../models/Cart.js';
import { ProductoBase } from '../models/Product.js';
import { User } from '../models/User.js';
import { validationResult } from 'express-validator';
import { ShippingMethod } from "../models/ShippingMethod.js";

const createQuotation = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const userId = req.user._id;
        const { shippingAddressId, shippingMethod, recipientName, phoneContact, additionalInstructions, validityDays = 7 } = req.body;

        // Obtener el usuario con sus direcciones
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, msg: "Usuario no encontrado" });
        }

        // Verificar que la dirección pertenezca al usuario
        const shippingAddress = user.addresses.id(shippingAddressId);
        if (!shippingAddress) {
            return res.status(404).json({ success: false, msg: "Dirección de envío no encontrada" });
        }

        // Verificar y obtener el transportista (carrier)
        const carrier = await ShippingMethod.findById(shippingMethod);
        if (!carrier || !carrier.active) {
            return res.status(404).json({ success: false, msg: "Método de envío inválido" });
        }

        // Seleccionar el primer método de envío por defecto
        const selectedMethod = carrier.methods.length > 0 ? carrier.methods[0] : null;
        if (!selectedMethod) {
            return res.status(404).json({ success: false, msg: "No hay métodos de envío disponibles" });
        }

        // Buscar el carrito del usuario
        const cart = await Cart.findOne({ userId }).populate('products.productId');
        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ success: false, msg: "El carrito está vacío" });
        }

        // Calcular el subtotal y verificar disponibilidad
        let subtotal = 0;
        let totalWeight = 0;

        // Validar productos y calcular subtotal
        for (const item of cart.products) {
            const producto = await ProductoBase.findById(item.productId);
            if (!producto) {
                return res.status(404).json({ success: false, msg: `Producto no encontrado: ${item.productId}` });
            }

            // Verificar que el producto esté disponible
            if (!producto.estado) {
                return res.status(400).json({ 
                    success: false, 
                    msg: `El producto ${producto.nombre} no está disponible` 
                });
            }

            // Verificar la variante seleccionada
            if (!item.variant || !item.variant.pesoId) {
                return res.status(400).json({ 
                    success: false, 
                    msg: `Información de variante incompleta para el producto: ${producto.nombre}` 
                });
            }

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
            
            // Acumular al subtotal
            const itemSubtotal = finalPrice * item.quantity;
            subtotal += itemSubtotal;

            // Calcular peso total
            if (selectedVariant.unidad === 'g') {
                // Convertir a kg si está en gramos
                totalWeight += (selectedVariant.peso / 1000) * item.quantity;
            } else if (selectedVariant.unidad === 'kg') {
                totalWeight += selectedVariant.peso * item.quantity;
            }
        }

        // Calcular el costo de envío
        let shippingCost = selectedMethod.base_cost || 0;
        if (totalWeight > 0 && selectedMethod.extra_cost_per_kg) {
            shippingCost += (totalWeight * selectedMethod.extra_cost_per_kg);
        }

        // Verificar si aplica envío gratuito
        if (selectedMethod.free_shipping_threshold && subtotal >= selectedMethod.free_shipping_threshold) {
            shippingCost = 0;
        }

        const total = subtotal + shippingCost;

        // Calcular fecha de validez
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validityDays);

        // Crear la cotización
        const quotation = new Quotation({
            userId,
            quotationDate: new Date(),
            status: "pending",
            subtotal,
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
            shipping: {
                carrier: carrier._id,
                method: selectedMethod.name,
                cost: shippingCost
            },
            validUntil
        });

        await quotation.save();

        // Guardar los detalles de la cotización
        for (const item of cart.products) {
            const producto = await ProductoBase.findById(item.productId);
            
            // Obtener la variante seleccionada
            const selectedVariant = producto.opcionesPeso.pesosEstandar.find(
                v => v._id.toString() === item.variant.pesoId.toString()
            );
            
            // Calcular precio final con descuento
            const basePrice = selectedVariant.precio;
            const discountPercentage = selectedVariant.descuentos?.regular || 0;
            const finalPrice = basePrice * (1 - (discountPercentage / 100));
            
            const quotationDetail = new QuotationDetail({
                quotationId: quotation._id,
                productId: item.productId,
                quantity: item.quantity,
                price: finalPrice,
                variant: {
                    pesoId: selectedVariant._id,
                    peso: selectedVariant.peso,
                    unidad: selectedVariant.unidad,
                    precio: basePrice,
                    sku: selectedVariant.sku || ''
                }
            });
            
            await quotationDetail.save();
        }

        // Vaciar el carrito del usuario
        await Cart.findByIdAndDelete(cart._id);

        await quotation.populate('shipping.carrier');

        res.status(201).json({ 
            success: true, 
            msg: "Cotización creada exitosamente", 
            quotation,
            costBreakdown: {
                subtotal,
                shippingCost,
                total
            }
        });
    } catch (err) {
        console.error("Error al crear la cotización:", err);
        res.status(500).json({ success: false, msg: "Error al crear la cotización", error: err.message });
    }
};

const getQuotations = async (req, res) => {
    try {
        const quotations = await Quotation.find()
            .populate('shipping.carrier')
            .populate('userId', 'name email');

        res.status(200).json({ 
            success: true, 
            quotations 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener las cotizaciones" 
        });
    }
};

const getQuotation = async (req, res) => {
    const { quotationId } = req.params;
    try {
        const quotation = await Quotation.findById(quotationId)
            .populate('shipping.carrier')
            .populate('userId', 'firstName lastName email');
        
        if (!quotation) {
            return res.status(404).json({ 
                success: false, 
                msg: "Cotización no encontrada" 
            });
        }
        
        const quotationDetails = await QuotationDetail.find({ quotationId: quotation._id }).populate({
            path: 'productId',
            model: 'Producto'
        });

        const responseQuotation = {
            ...quotation.toObject(),
            products: quotationDetails.map(detail => ({
                product: detail.productId,
                quantity: detail.quantity,
                price: detail.price,
                variant: detail.variant
            }))
        };
        
        res.status(200).json({ 
            success: true, 
            quotation: responseQuotation 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener la cotización" 
        });
    }
};

const updateQuotation = async (req, res) => {
    const { _id } = req.params;
    try {
        const quotation = await Quotation.findById(_id);
        if (!quotation) {
            return res.status(404).json({ 
                success: false, 
                msg: "Cotización no encontrada" 
            });
        }

        console.log(req.body);

        // Actualizar campos permitidos
        if (req.body.status) quotation.status = req.body.status;
        if (req.body.notes) quotation.notes = req.body.notes;
        if (req.body.validUntil) quotation.validUntil = new Date(req.body.validUntil);
        if (req.body.additionalDetails) quotation.additionalDetails = req.body.additionalDetails;
        if (req.body.rejectionReason) quotation.rejectionReason = req.body.rejectionReason;

        // Si la cotización se aprueba, actualizar campos adicionalesnotes
        if (req.body.status === 'approved') {
            if (req.body.orderId) {
                quotation.orderId = req.body.orderId;
            }
        }

        await quotation.save();
        await quotation.populate('shipping.carrier');

        res.status(200).json({ 
            success: true, 
            msg: "Cotización actualizada correctamente",
            quotation 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al actualizar la cotización" 
        });
    }
};

const deleteQuotation = async (req, res) => {
    const { _id } = req.params;
    try {
        const quotation = await Quotation.findById(_id);
        if (!quotation) {
            return res.status(404).json({ 
                success: false, 
                msg: "Cotización no encontrada" 
            });
        }

        // Eliminar los detalles de la cotización
        await QuotationDetail.deleteMany({ quotationId: _id });
        
        // Eliminar la cotización
        await quotation.deleteOne();

        res.status(200).json({ 
            success: true, 
            msg: "Cotización eliminada correctamente" 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al eliminar la cotización" 
        });
    }
};

const getUserQuotations = async (req, res) => {
    try {
        const userId = req.user._id;
        const quotations = await Quotation.find({ userId })
            .populate('shipping.carrier')
            .populate('userId', 'firstName lastName email');

        // Obtener los detalles de los productos para cada cotización
        const quotationsWithDetails = await Promise.all(
            quotations.map(async (quotation) => {
                const quotationDetails = await QuotationDetail.find({ quotationId: quotation._id })
                    .populate('productId');
                
                return {
                    ...quotation.toObject(),
                    products: quotationDetails.map(detail => ({
                        product: detail.productId,
                        quantity: detail.quantity,
                        price: detail.price,
                        variant: detail.variant
                    }))
                };
            })
        );

        res.status(200).json({ 
            success: true, 
            quotations: quotationsWithDetails 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener las cotizaciones del usuario" 
        });
    }
};

const getAllQuotations = async (req, res) => {
    try {
        const quotations = await Quotation.find()
            .populate('shipping.carrier')
            .populate('userId', 'firstName lastName email');

        // Obtener los detalles de los productos para cada cotización
        const quotationsWithDetails = await Promise.all(
            quotations.map(async (quotation) => {
                const quotationDetails = await QuotationDetail.find({ quotationId: quotation._id })
                    .populate('productId');
                
                return {
                    ...quotation.toObject(),
                    products: quotationDetails.map(detail => ({
                        product: detail.productId,
                        quantity: detail.quantity,
                        price: detail.price,
                        variant: detail.variant
                    }))
                };
            })
        );

        res.status(200).json({ 
            success: true, 
            quotations: quotationsWithDetails 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ 
            success: false, 
            msg: "Error al obtener todas las cotizaciones" 
        });
    }
};

export { createQuotation, getQuotations, getQuotation, updateQuotation, deleteQuotation, getUserQuotations, getAllQuotations };