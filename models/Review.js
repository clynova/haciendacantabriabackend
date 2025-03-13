import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true },
    },
    { timestamps: true } // Agrega automáticamente createdAt y updatedAt
);

const Review = mongoose.model("Review", reviewSchema);

export { Review };
