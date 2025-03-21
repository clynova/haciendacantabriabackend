import mongoose from "mongoose";

const quotationDetailSchema = new mongoose.Schema(
    {
        quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation", required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        notes: { type: String } // Notas específicas del producto
    },
    { timestamps: true }
);

const QuotationDetail = mongoose.model("QuotationDetail", quotationDetailSchema);

export { QuotationDetail };