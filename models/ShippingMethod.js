import mongoose from "mongoose";

const shippingMethodSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        tracking_url: {
            type: String,
            trim: true,
            default: ""
        },
        methods: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                delivery_time: {
                    type: String,
                    required: true,
                    trim: true
                },
                base_cost: {
                    type: Number,
                    required: true,
                    min: 0
                },
                extra_cost_per_kg: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0
                }
            }
        ],
        active: { 
            type: Boolean, 
            default: true 
        }
    },
    { 
        timestamps: true 
    }
);

const ShippingMethod = mongoose.model("ShippingMethod", shippingMethodSchema);

export { ShippingMethod };