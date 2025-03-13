import mongoose from "mongoose";

const orderDetailSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
    },
    { timestamps: true, collection: 'order_details' } // Agrega automáticamente createdAt y updatedAt
);

const OrderDetail = mongoose.model("OrderDetail", orderDetailSchema);

export { OrderDetail };
