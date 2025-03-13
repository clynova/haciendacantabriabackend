import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { validationResult } from 'express-validator';

const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('productId', 'name price images') // Only get relevant product fields
            .populate('userId', 'firstName email') // Only get relevant user fields
            .sort({ createdAt: -1 }); // Sort by newest first

        res.json({ success: true, data: reviews });

    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al obtener las reviews" });
    }
};

const getReviewById = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ success: false, msg: "Errores de validación", errors: errors.array() });
        }
        const { _id } = req.params;
        const review = await Review.findById(_id)
            .populate('productId', 'name price images') // Only get relevant product fields
            .populate('userId', 'firstName email'); // Only get relevant user fields

        if (!review) {
            return res.status(404).send({ success: false, msg: "Review no encontrada" });
        }

        res.status(200).json({ success: true, data: review });

    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al obtener las reviews" });
    }
};

const createReview = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const { productId, userId, rating, comment } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ success: false, msg: "El producto no existe" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, msg: "El usuario no existe" });
        }

        const newReview = new Review({ productId, userId, rating, comment });
        await newReview.save();

        res.status(201).send({ success: true, msg: "Review creada exitosamente", data: newReview });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al crear la review" });
    }
};

const updateReview = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const { _id } = req.params;
        const { rating, comment } = req.body;

        const review = await Review.findById(_id);
        if (!review) {
            return res.status(404).send({ success: false, msg: "La review no existe" });
        }

        if (rating) review.rating = rating;
        if (comment) review.comment = comment;

        await review.save();

        res.status(200).send({ success: true, msg: "Review actualizada exitosamente", data: review });

    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al actualizar la review" });
    }
};

const deleteReview = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ success: false, msg: "Errores de validación", errors: errors.array() });
        }
        const { _id } = req.params;
        const review = await Review.findById(_id);

        if (!review) {
            return res.status(404).send({ success: false, msg: "La review no existe" });
        }
        await Review.findByIdAndDelete(_id);
        res.status(200).send({ success: true, msg: "Review eliminada exitosamente", data: review });


    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al obtener las reviews" });
    }
};

const validarUsuario = (req, res, next) => {
    if (req.user._id.toString() !== req.params._id && req.user.roles !== 'admin') {
        return res.status(401).send({ success: false, msg: "No autorizado" });
    }
    next();
}



export { getReviews, createReview, updateReview, deleteReview, getReviewById }