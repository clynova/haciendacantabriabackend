import { ProductoBase, ProductoCarne, ProductoAceite } from "../models/Product.js";
import { validationResult } from 'express-validator';

const products = async (req, res) => {
    try {
        const { categoria, tipoProducto } = req.query;
        const filter = {};
        
        if (categoria) {
            filter.categoria = categoria;
        }
        
        if (tipoProducto) {
            filter.tipoProducto = tipoProducto;
        }
        
        const products = await ProductoBase.find(filter);
        res.status(200).send({ 
            success: true, 
            msg: 'Productos enviados', 
            count: products.length,
            products 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: "Error al obtener los productos" });
    }
};

const getProduct = async (req, res) => {
    try {
        const { _id } = req.params;
        const product = await ProductoBase.findById(_id);
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
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ 
                success: false, 
                msg: "Errores de validación", 
                errors: errors.array() 
            });
        }

        let ProductModel;
        switch (req.body.tipoProducto) {
            case 'ProductoCarne':
                ProductModel = ProductoCarne;
                break;
            case 'ProductoAceite':
                ProductModel = ProductoAceite;
                break;
            default:
                return res.status(400).send({ 
                    success: false, 
                    msg: "Tipo de producto no válido" 
                });
        }

        const product = new ProductModel(req.body);
        const savedProduct = await product.save();

        res.status(201).send({
            success: true,
            msg: "Producto creado correctamente",
            data: savedProduct
        });

    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            res.status(400).send({ 
                success: false, 
                msg: "Ya existe un producto con ese código o SKU" 
            });
        } else {
            res.status(500).send({ 
                success: false, 
                msg: "Error al registrar el producto" 
            });
        }
    }
};

const updateProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ 
                success: false, 
                msg: "Errores de validación", 
                errors: errors.array() 
            });
        }

        const { _id } = req.params;
        
        // First find the product to get its type
        const existingProduct = await ProductoBase.findById(_id);
        if (!existingProduct) {
            return res.status(404).send({ 
                success: false, 
                msg: "Producto no encontrado" 
            });
        }

        // If trying to change product type, prevent it
        if (req.body.tipoProducto && req.body.tipoProducto !== existingProduct.tipoProducto) {
            return res.status(400).send({ 
                success: false, 
                msg: "No se puede cambiar el tipo de producto" 
            });
        }

        // Update the product
        const updatedProduct = await ProductoBase.findByIdAndUpdate(
            _id,
            { 
                ...req.body,
                fechaActualizacion: new Date()
            },
            { 
                new: true,
                runValidators: true
            }
        );

        res.status(200).send({
            success: true,
            msg: "Producto modificado correctamente",
            data: updatedProduct
        });

    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            res.status(400).send({ 
                success: false, 
                msg: "Ya existe un producto con ese código o SKU" 
            });
        } else {
            res.status(500).send({ 
                success: false, 
                msg: "Error al modificar el producto" 
            });
        }
    }
};

const deleteProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({ 
                success: false, 
                msg: "Errores de validación", 
                errors: errors.array() 
            });
        }

        const { _id } = req.params;
        const product = await ProductoBase.findByIdAndDelete(_id);

        if (!product) {
            return res.status(404).send({ 
                success: false, 
                msg: "Producto no encontrado" 
            });
        }

        res.status(200).send({
            success: true,
            msg: "Producto eliminado correctamente",
            data: {
                _id: product._id,
                nombre: product.nombre,
                tipoProducto: product.tipoProducto
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({ 
            success: false, 
            msg: "Error interno al eliminar el producto" 
        });
    }
};

const findProducts = async (req, res) => {
    try {
        const { 
            nombre, 
            categoria,
            tipoProducto,
            precioMin, 
            precioMax,
            tipoCarne,
            corte,
            tipoAceite
        } = req.query;
        
        const filter = {};
        
        // Base filters
        if (nombre) {
            filter.nombre = { $regex: nombre, $options: 'i' };
        }
        if (categoria) {
            filter.categoria = categoria;
        }
        if (tipoProducto) {
            filter.tipoProducto = tipoProducto;
        }
        if (precioMin !== undefined || precioMax !== undefined) {
            filter['precios.base'] = {};
            if (precioMin !== undefined) {
                filter['precios.base'].$gte = Number(precioMin);
            }
            if (precioMax !== undefined) {
                filter['precios.base'].$lte = Number(precioMax);
            }
        }
        
        // Meat specific filters
        if (tipoCarne) {
            filter['infoCarne.tipoCarne'] = tipoCarne;
        }
        if (corte) {
            filter['infoCarne.corte'] = corte;
        }
        
        // Oil specific filters
        if (tipoAceite) {
            filter['infoAceite.tipo'] = tipoAceite;
        }
        
        const products = await ProductoBase.find(filter);
        
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

export { products, getProduct, createProduct, updateProduct, deleteProduct, findProducts };