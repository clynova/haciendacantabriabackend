import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        orderDate: { type: Date, default: Date.now },
        status: { 
            type: String, 
            required: true, 
            enum: ["pending", "processing", "completed", "canceled", "finalized"],
            default: "pending"
        },
        subtotal: { type: Number, required: true }, // Subtotal solo de productos
        shippingCost: { type: Number, required: true }, // Costo de envío
        paymentCommission: { type: Number, required: true }, // Comisión del método de pago
        total: { type: Number, required: true },    // Total con envío y comisiones
        shippingAddress: {
            street: { type: String, required: true, trim: true },
            city: { type: String, required: true, trim: true },
            state: { type: String, required: true, trim: true },
            country: { type: String, required: true, trim: true },
            zipCode: { type: String, required: true, trim: true },
            reference: { type: String, trim: true }, // Campo de referencia para ayudar al repartidor
            phoneContact: { type: String, trim: true }, // Teléfono de contacto para la entrega
            recipientName: { type: String, required: true, trim: true }, // Nombre de quien recibe
            additionalInstructions: { type: String, trim: true } // Instrucciones adicionales para la entrega
        },
        paymentMethod: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentMethod",
            required: true
        },
        payment: {
            status: { 
                type: String, 
                enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
                default: 'pending'
            },
            token: { type: String },
            transactionId: { type: String },
            provider: { type: String },
            amount: { type: Number },
            currency: { type: String, default: 'CLP' },
            paymentDate: { type: Date },
            paymentDetails: { type: mongoose.Schema.Types.Mixed },
            commissionPercentage: { type: Number }, // Porcentaje de comisión aplicado
            commissionAmount: { type: Number }      // Monto de la comisión cobrada
        },
        shipping: {
            carrier: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ShippingMethod',
                required: true
            },
            method: {
                type: String,
                required: true
            },
            cost: {
                type: Number,
                required: true
            },
            trackingNumber: {
                type: String,
                default: null
            }
        },
        estimatedDeliveryDate: {
            type: Date,
            required: true
        },
        quotationId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Quotation",
            default: null
        }, // Para órdenes creadas desde cotizaciones
        notes: { type: String }, // Notas internas o comentarios del admin
        comprobanteTipo: {
            type: String,
            enum: ["boleta", "factura"],
            default: "boleta"
        }, // Tipo de comprobante (boleta o factura)
        rut: {
            type: String,
            trim: true
        } // RUT del usuario o empresa para facturación (opcional)
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual para obtener los detalles de la orden
orderSchema.virtual('details', {
    ref: 'OrderDetail',
    localField: '_id',
    foreignField: 'orderId',
    justOne: false
});

const Order = mongoose.model("Order", orderSchema);

export { Order };
