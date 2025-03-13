import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        price: { type: Number, required: true },
        images: [{ type: String, trim: true }],
        stock: { type: Number, default: 0 },
        tags: [{ type: String, trim: true }] // Array de etiquetas para categorización multidimensional
    },
    { timestamps: true } // Agrega automáticamente createdAt y updatedAt
);

// Añadir índice para mejorar el rendimiento en búsquedas por etiquetas
productSchema.index({ tags: 1 });

const Product = mongoose.model("Product", productSchema);

export { Product };
