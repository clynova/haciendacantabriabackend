import mongoose from "mongoose";

const orderDetailSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
        quantity: { type: Number, required: true, min: 1 },
        // Información sobre la variante del producto comprado
        variant: {
            pesoId: { type: mongoose.Schema.Types.ObjectId }, // ID de la variante de peso seleccionada
            peso: { type: Number, required: true },
            unidad: { 
                type: String, 
                required: true,
                enum: ['g', 'kg', 'ml', 'L', 'unidades']
            },
            sku: { type: String, required: true }
        },
        // Precios y descuentos
        priceInfo: {
            basePrice: { type: Number, required: true }, // Precio base sin descuento
            discountPercentage: { type: Number, default: 0 }, // Porcentaje de descuento aplicado
            finalPrice: { type: Number, required: true }, // Precio final después del descuento
        },
        // Subtotal para este item (precio final × cantidad)
        subtotal: { type: Number, required: true },
        // Información del producto en el momento de la compra
        productSnapshot: {
            nombre: { type: String, required: true },
            categoria: { type: String, required: true },
            tipoProducto: { type: String, required: true }, // ProductoCarne, ProductoAceite, etc.
            imagen: { type: String }, // URL de la imagen principal
        }
    },
    { 
        timestamps: true, 
        collection: 'order_details' 
    }
);

// Middleware para calcular el subtotal antes de guardar
orderDetailSchema.pre('save', function (next) {
    if (this.isModified('quantity') || this.isModified('priceInfo.finalPrice')) {
        this.subtotal = this.quantity * this.priceInfo.finalPrice;
    }
    next();
});

const OrderDetail = mongoose.model("OrderDetail", orderDetailSchema);

export { OrderDetail };
