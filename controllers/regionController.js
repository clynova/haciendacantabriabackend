import { Region } from '../models/Region.js';

// Obtener todas las regiones
const getRegions = async (req, res) => {
    try {
        const regions = await Region.find({ isActive: true });
        res.status(200).json({ success: true, data: regions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al obtener las regiones" });
    }
};

const getRegionsAll = async (req, res) => {
    try {
        const regions = await Region.find();
        res.status(200).json({ success: true, data: regions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al obtener las regiones" });
    }
};

// Obtener una región por ID
const getRegionById = async (req, res) => {
    try {
        const region = await Region.findById(req.params.id);
        if (!region) {
            return res.status(404).json({ success: false, message: "Región no encontrada" });
        }
        res.status(200).json({ success: true, data: region });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al obtener la región" });
    }
};

// Crear una nueva región
const createRegion = async (req, res) => {
    try {
        const { name, code } = req.body;
        const region = await Region.create({
            name,
            code
        });
        res.status(201).json({ success: true, data: region });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "Ya existe una región con ese nombre o código" 
            });
        }
        res.status(500).json({ success: false, message: "Error al crear la región" });
    }
};

// Actualizar una región
const updateRegion = async (req, res) => {
    try {
        const { name, code, isActive } = req.body;
        const region = await Region.findByIdAndUpdate(
            req.params.id,
            {
                name,
                code,
                isActive,
            },
            { new: true }
        );

        if (!region) {
            return res.status(404).json({ success: false, message: "Región no encontrada" });
        }

        res.status(200).json({ success: true, data: region });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: "Ya existe una región con ese nombre o código" 
            });
        }
        res.status(500).json({ success: false, message: "Error al actualizar la región" });
    }
};

// Actualizar el estado de una región
const updateRegionStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ 
                success: false, 
                message: "El estado debe ser un valor booleano" 
            });
        }

        const region = await Region.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        );

        if (!region) {
            return res.status(404).json({ 
                success: false, 
                message: "Región no encontrada" 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: region,
            message: `Región ${isActive ? 'activada' : 'desactivada'} exitosamente`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: "Error al actualizar el estado de la región" 
        });
    }
};

// Eliminar una región
const deleteRegion = async (req, res) => {
    try {
        const region = await Region.findByIdAndDelete(req.params.id);
        
        if (!region) {
            return res.status(404).json({ success: false, message: "Región no encontrada" });
        }

        res.status(200).json({ success: true, message: "Región eliminada exitosamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al eliminar la región" });
    }
};

export {
    getRegions,
    getRegionById,
    createRegion,
    updateRegion,
    deleteRegion,
    updateRegionStatus,
    getRegionsAll
};