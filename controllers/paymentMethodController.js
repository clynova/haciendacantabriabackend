import { PaymentMethod } from "../models/PaymentMethod.js";
import { validationResult } from "express-validator";

const createPaymentMethod = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }
        const paymentMethod = new PaymentMethod(req.body);
        const savedPaymentMethod = await paymentMethod.save();
        res.status(201).json({
            success: true,
            msg: "Método de pago creado correctamente",
            data: savedPaymentMethod
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al crear el método de pago" });
    }
};

const getPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find({ active: true });
        res.status(200).json({
            success: true,
            msg: "Métodos de pago enviados",
            data: paymentMethods
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al obtener los métodos de pago" });
    }
};

const getAllPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find();
        res.status(200).json({
            success: true,
            msg: "Todos los métodos de pago enviados",
            data: paymentMethods
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al obtener todos los métodos de pago" });
    }
};

const getPaymentMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const paymentMethod = await PaymentMethod.findById(id);
        if (!paymentMethod) {
            return res.status(404).json({ success: false, msg: "Método de pago no encontrado" });
        }
        res.status(200).json({
            success: true,
            msg: "Método de pago enviado",
            data: paymentMethod
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al obtener el método de pago" });
    }
};

const updatePaymentMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const paymentMethod = await PaymentMethod.findById(id);
        if (!paymentMethod) {
            return res.status(404).json({ success: false, msg: "Método de pago no encontrado" });
        }

        // Actualizar campos principales
        paymentMethod.name = req.body.name || paymentMethod.name;
        paymentMethod.type = req.body.type || paymentMethod.type;
        paymentMethod.description = req.body.description !== undefined ? req.body.description : paymentMethod.description;
        paymentMethod.provider = req.body.provider || paymentMethod.provider;
        paymentMethod.logo_url = req.body.logo_url !== undefined ? req.body.logo_url : paymentMethod.logo_url;
        paymentMethod.requires_additional_data = req.body.requires_additional_data !== undefined ?
            req.body.requires_additional_data : paymentMethod.requires_additional_data;

        if (req.body.additional_fields && Array.isArray(req.body.additional_fields)) {
            paymentMethod.additional_fields = req.body.additional_fields;
        }

        paymentMethod.commission_percentage = req.body.commission_percentage !== undefined ?
            req.body.commission_percentage : paymentMethod.commission_percentage;

        paymentMethod.active = req.body.active !== undefined ? req.body.active : paymentMethod.active;

        await paymentMethod.save();
        res.status(200).json({
            success: true,
            msg: "Método de pago modificado correctamente",
            data: paymentMethod
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al actualizar el método de pago" });
    }
};

const deletePaymentMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const paymentMethod = await PaymentMethod.findById(id);
        if (!paymentMethod) {
            return res.status(404).json({ success: false, msg: "Método de pago no encontrado" });
        }

        // Soft delete
        paymentMethod.active = false;
        await paymentMethod.save();

        res.status(200).json({
            success: true,
            msg: "Método de pago eliminado correctamente",
            data: {
                _id: paymentMethod._id,
                name: paymentMethod.name
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al eliminar el método de pago" });
    }
};

const restorePaymentMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const paymentMethod = await PaymentMethod.findById(id);
        if (!paymentMethod) {
            return res.status(404).json({ success: false, msg: "Método de pago no encontrado" });
        }

        // Restaurar
        paymentMethod.active = true;
        await paymentMethod.save();

        res.status(200).json({
            success: true,
            msg: "Método de pago restaurado correctamente",
            data: {
                _id: paymentMethod._id,
                name: paymentMethod.name
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al restaurar el método de pago" });
    }
};

export {
    createPaymentMethod,
    getPaymentMethods,
    getAllPaymentMethods,
    getPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    restorePaymentMethod
};