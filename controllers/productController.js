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

        let ProductModel;
        switch (req.body.tipoProducto) {
            case 'ProductoCarne':
                ProductModel = ProductoCarne;
                break;
            case 'ProductoAceite':
                ProductModel = ProductoAceite;
                break;
            case 'ProductoBase':
                ProductModel = ProductoBase;
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

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                code: 11000,
                error: {
                    keyPattern: error.keyPattern,
                    keyValue: error.keyValue,
                    message: 'Duplicate key error'
                }
            });
        }
        console.error(error);
        if (error.code === 11000) {
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
        const productId = req.params._id || req.params.id;

        if (!productId) {
            return res.status(400).json({
                success: false,
                msg: 'ID de producto no proporcionado'
            });
        }

        const updateData = { ...req.body };

        // Process tags
        updateData.tags = Array.isArray(updateData.tags)
            ? updateData.tags.filter(tag => tag && tag.trim()).map(tag => tag.trim())
            : [];

        updateData.fechaActualizacion = new Date();

        // Process boolean fields
        updateData.estado = Boolean(updateData.estado);
        updateData.destacado = Boolean(updateData.destacado);

        if (updateData.conservacion) {
            updateData.conservacion = {
                ...updateData.conservacion,
                requiereRefrigeracion: Boolean(updateData.conservacion.requiereRefrigeracion),
                requiereCongelacion: Boolean(updateData.conservacion.requiereCongelacion)
            };
        }

        // Remove calculated fields
        delete updateData.precioFinal;
        delete updateData.precioTransferencia;
        delete updateData.precioPorKgFinal;
        delete updateData.precioPorKgTransferencia;
        delete updateData.__v;

        const updatedProduct = await ProductoBase.findByIdAndUpdate(
            productId,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                msg: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            msg: 'Producto actualizado exitosamente',
            product: updatedProduct
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                msg: 'Error de validación',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                msg: 'Ya existe un producto con ese código o SKU'
            });
        }

        res.status(500).json({
            success: false,
            msg: 'Error al modificar el producto',
            error: error.message
        });
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

        // Filtrar por etiquetas si se proporcionan
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            filter.tags = { $in: tagArray };
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
const getActiveProducts = async (req, res) => {
    try {
        const { categoria, tipoProducto } = req.query;
        const filter = { estado: true };

        if (categoria) {
            filter.categoria = categoria;
        }

        if (tipoProducto) {
            filter.tipoProducto = tipoProducto;
        }

        const products = await ProductoBase.find(filter);
        res.status(200).json({
            success: true,
            msg: 'Productos activos enviados',
            count: products.length,
            products
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            msg: "Error al obtener los productos activos"
        });
    }
};

const getAllProductsAdmin = async (req, res) => {
    try {
        // Verificar que el usuario tenga rol de admin
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({
                success: false,
                msg: "No tienes permiso para ver todos los productos"
            });
        }

        const products = await ProductoBase.find();
        res.status(200).json({
            success: true,
            msg: 'Lista completa de productos',
            count: products.length,
            products
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            msg: "Error al obtener la lista completa de productos"
        });
    }
};

const updateProductStatus = async (req, res) => {
    try {
        // Verificar que el usuario tenga rol de admin
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({
                success: false,
                msg: "No tienes permiso para actualizar el estado del producto"
            });
        }

        const { _id } = req.params;
        const { estado } = req.body;

        const product = await ProductoBase.findById(_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                msg: "Producto no encontrado"
            });
        }

        product.estado = estado;
        product.fechaActualizacion = new Date();
        await product.save();

        res.status(200).json({
            success: true,
            msg: "Estado del producto actualizado correctamente",
            product
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            msg: "Error al actualizar el estado del producto",
            error: err.message
        });
    }
};

/**
 * Envía correos electrónicos a todos los usuarios que tienen un producto en su lista de favoritos
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const notificarProductoFavorito = async (req, res) => {
    try {
        // Verificar que el usuario tenga rol de admin
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({
                success: false,
                msg: "No tienes permiso para realizar esta acción"
            });
        }

        const { _id } = req.params;
        
        // Importar la función de envío de emails
        const { enviarEmailProductoFavorito } = await import('../controllers/emailController.js');
        
        // Enviar emails a usuarios con este producto en favoritos
        const resultado = await enviarEmailProductoFavorito(_id);
        
        res.status(200).json({
            success: true,
            msg: "Notificaciones enviadas correctamente",
            resultado
        });
    } catch (error) {
        console.error('Error al enviar notificaciones:', error);
        res.status(500).json({
            success: false,
            msg: "Error al enviar notificaciones",
            error: error.message
        });
    }
};

export {
    products,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    findProducts,
    getActiveProducts,
    getAllProductsAdmin,
    updateProductStatus,
    notificarProductoFavorito
};