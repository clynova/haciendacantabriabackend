import mongoose from "mongoose";

const regionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        code: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Region = mongoose.model("Region", regionSchema);

export { Region };