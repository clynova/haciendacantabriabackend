import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Referencia a la orden si se convierte
        quotationDate: { type: Date, default: Date.now },
        status: { 
            type: String, 
            required: true, 
            enum: ["pending", "approved", "rejected", "converted"],
            default: "pending"
        },
        subtotal: { type: Number, required: true },
        total: { type: Number, required: true },
        shippingAddress: {
            street: { type: String, required: true, trim: true },
            city: { type: String, required: true, trim: true },
            state: { type: String, required: true, trim: true },
            country: { type: String, required: true, trim: true },
            zipCode: { type: String, required: true, trim: true },
            reference: { type: String, trim: true },
            phoneContact: { type: String, trim: true },
            recipientName: { type: String, required: true, trim: true },
            additionalInstructions: { type: String, trim: true }
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
            }
        },
        notes: { type: String }, // Notas administrativas
        validUntil: { type: Date, required: true }, // Período de validez de la cotización
        additionalDetails: { type: mongoose.Schema.Types.Mixed }, // Para información extra
        rejectionReason: { type: String, trim: true }
    },
    { timestamps: true }
);

const Quotation = mongoose.model("Quotation", quotationSchema);

export { Quotation };