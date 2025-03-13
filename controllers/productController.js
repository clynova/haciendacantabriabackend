import { Product } from "../models/Product.js";
import { validationResult } from 'express-validator';

const products = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).send({ success: true, msg: 'Productos enviados', products });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al obtener los productos" });
    }
};

const getProduct = async (req, res) => {
    try {
        const { _id } = req.params;
        const product = await Product.findById(_id);
        if (!product) {
            return res.status(404).send({ success: false, msg: "El producto no existe" });
        }
        res.status(200).send({ success: true, msg: 'Producto enviado', product });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al obtener el producto" });
    }
};

const createProduct = async (req, res) => {
    try {
        // Validar errores de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ success: false, msg: "Errores de validación", errors: errors.array() });
        }
        
        // Validar tags si están presentes
        if (req.body.tags && !Array.isArray(req.body.tags)) {
            return res.status(400).send({ 
                success: false, 
                msg: "El campo 'tags' debe ser un array de strings" 
            });
        }
        
        // Procesar tags si existen
        if (req.body.tags) {
            req.body.tags = req.body.tags
                .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                .map(tag => tag.trim());
        }

        // Crear el producto
        const product = new Product(req.body);
        const productGuardado = await product.save();

        res.status(201).send({
            success: true,
            msg: "Producto creado correctamente",
            data: {
                _id: productGuardado._id,
                name: productGuardado.name,
                description: productGuardado.description,
                tags: productGuardado.tags
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al registrar el producto" });
    }
};

const updateProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const { _id } = req.params;
        const { name, description, price, images, stock, tags } = req.body;

        const product = await Product.findById(_id);
        if (!product) {
            return res.status(404).json({ success: false, msg: "Producto no encontrado" });
        }

        if (name) product.name = name;
        if (description) product.description = description;
        if (price) product.price = price;
        if (images) product.images = images;
        if (stock !== undefined) product.stock = stock;
        
        // Gestión de etiquetas
        if (tags) {
            if (!Array.isArray(tags)) {
                return res.status(400).json({ 
                    success: false, 
                    msg: "El campo 'tags' debe ser un array de strings" 
                });
            }
            
            // Procesar tags
            product.tags = tags
                .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
                .map(tag => tag.trim());
        }
        
        product.updatedAt = new Date();
        await product.save()

        res.status(200).json({
            success: true,
            msg: "Producto modificado correctamente",
            data: product
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: "Error al modificar el producto" });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, msg: "Errores de validación", errors: errors.array() });
        }

        const { _id } = req.params; // Obtener el ID desde la URL

        // Buscar y eliminar el producto
        const product = await Product.findByIdAndDelete(_id);

        if (!product) {
            return res.status(404).json({ success: false, msg: "Producto no encontrado" });
        }

        res.status(200).json({
            success: true,
            msg: "Producto eliminado correctamente",
            data: {
                _id: product._id,
                name: product.name
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, msg: "Error interno al eliminar el producto" });
    }
};

/**
 * Buscar productos por filtros avanzados incluyendo etiquetas
 */
const findProducts = async (req, res) => {
    try {
        const { name, minPrice, maxPrice, tags } = req.query;
        
        // Construir el objeto de filtro
        const filter = {};
        
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }
        
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) {
                filter.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined) {
                filter.price.$lte = Number(maxPrice);
            }
        }
        
        // Filtrar por etiquetas si se proporcionan
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            filter.tags = { $in: tagArray };
        }
        
        const products = await Product.find(filter);
        
        res.status(200).send({
            success: true,
            msg: "Productos encontrados",
            count: products.length,
            products
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send({ 
            success: false, 
            msg: "Error al buscar productos" 
        });
    }
};

export { products, getProduct, createProduct, updateProduct, deleteProduct, findProducts }