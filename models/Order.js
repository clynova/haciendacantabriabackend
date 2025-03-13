import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        orderDate: { type: Date, default: Date.now },
        status: { type: String, required: true, enum: ["pending", "completed", "canceled"] },
        subtotal: { type: Number, required: true }, // Subtotal solo de productos
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
            type: String,  // Cambiado de ObjectId a String para coincidir con la validación de MongoDB
            required: true
        },
        payment: {
            status: { 
                type: String, 
                enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
                default: 'pending'
            },
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
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export { Order };
