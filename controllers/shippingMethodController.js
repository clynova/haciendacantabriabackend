import { ShippingMethod } from "../models/ShippingMethod.js";

const createShippingMethod = async (req, res) => {
    try {
        const shippingMethod = new ShippingMethod(req.body);
        const savedShippingMethod = await shippingMethod.save();
        res.status(201).json({
            success: true,
            msg: "Método de envío creado correctamente",
            data: savedShippingMethod
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al crear el método de envío" });
    }
};

const getShippingMethods = async (req, res) => {
    try {
        const shippingMethods = await ShippingMethod.find({ active: true });
        res.status(200).json({
            success: true,
            msg: "Métodos de envío enviados",
            data: shippingMethods
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al obtener los métodos de envío" });
    }
};

const getShippingMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const shippingMethod = await ShippingMethod.findById(id);
        if (!shippingMethod) {
            return res.status(404).json({ success: false, msg: "Método de envío no encontrado" });
        }
        res.status(200).json({
            success: true,
            msg: "Método de envío enviado",
            data: shippingMethod
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al obtener el método de envío" });
    }
};

const updateShippingMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const shippingMethod = await ShippingMethod.findById(id);
        if (!shippingMethod) {
            return res.status(404).json({ success: false, msg: "Método de envío no encontrado" });
        }

        // Actualizar campos principales
        shippingMethod.name = req.body.name || shippingMethod.name;
        shippingMethod.tracking_url = req.body.tracking_url !== undefined ? req.body.tracking_url : shippingMethod.tracking_url;
        
        // Actualizar métodos si se proporcionan
        if (req.body.methods && Array.isArray(req.body.methods)) {
            shippingMethod.methods = req.body.methods;
        }
        
        shippingMethod.active = req.body.active !== undefined ? req.body.active : shippingMethod.active;

        await shippingMethod.save();
        res.status(200).json({
            success: true,
            msg: "Método de envío modificado correctamente",
            data: shippingMethod
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al actualizar el método de envío" });
    }
};

const deleteShippingMethod = async (req, res) => {
    const { id } = req.params;
    try {
        const shippingMethod = await ShippingMethod.findById(id);
        if (!shippingMethod) {
            return res.status(404).json({ success: false, msg: "Método de envío no encontrado" });
        }

        // Soft delete
        shippingMethod.active = false;
        await shippingMethod.save();
        
        res.status(200).json({
            success: true,
            msg: "Método de envío eliminado correctamente",
            data: {
                _id: shippingMethod._id,
                name: shippingMethod.name
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, msg: "Error al eliminar el método de envío" });
    }
};

export {
    createShippingMethod,
    getShippingMethods,
    getShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
};