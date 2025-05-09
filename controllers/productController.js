import { ProductoBase, ProductoCarne, ProductoAceite } from "../models/Product.js";
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

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
        
        // Try to find by ID first, if it's a valid MongoDB ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(_id);
        let product;
        
        if (isValidObjectId) {
            product = await ProductoBase.findById(_id);
        }
        
        // If no product found by ID or ID is invalid, try to find by slug
        if (!product) {
            product = await ProductoBase.findOne({ slug: _id });
        }

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

        // Log the body for debugging
        console.log("Datos del producto a crear:", JSON.stringify(req.body, null, 2));

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

        // Validar variantes de peso y sus precios
        if (req.body.opcionesPeso && req.body.opcionesPeso.pesosEstandar) {
            if (!Array.isArray(req.body.opcionesPeso.pesosEstandar)) {
                return res.status(400).send({
                    success: false,
                    msg: "El campo 'opcionesPeso.pesosEstandar' debe ser un array"
                });
            }

            // Validar que cada variante tenga precio, peso y unidad
            for (let i = 0; i < req.body.opcionesPeso.pesosEstandar.length; i++) {
                const variante = req.body.opcionesPeso.pesosEstandar[i];
                
                if (!variante.precio || isNaN(Number(variante.precio))) {
                    return res.status(400).send({
                        success: false,
                        msg: `La variante ${i + 1} debe tener un precio válido`
                    });
                }

                if (!variante.peso || isNaN(Number(variante.peso))) {
                    return res.status(400).send({
                        success: false,
                        msg: `La variante ${i + 1} debe tener un peso válido`
                    });
                }

                if (!variante.unidad) {
                    return res.status(400).send({
                        success: false,
                        msg: `La variante ${i + 1} debe tener una unidad`
                    });
                }

                // Convertir precio a número si viene como string
                variante.precio = Number(variante.precio);
                
                // Asegurarse que descuentos sea un objeto válido
                if (!variante.descuentos) {
                    variante.descuentos = { regular: 0 };
                } else if (typeof variante.descuentos.regular !== 'number') {
                    variante.descuentos.regular = Number(variante.descuentos.regular) || 0;
                }
            }
        } else {
            // Si no hay variantes de peso, devolver error
            return res.status(400).send({
                success: false,
                msg: "El producto debe tener al menos una variante de peso"
            });
        }

        // Verificar si ya existe un producto con el mismo SKU o slug
        const existingProduct = await ProductoBase.findOne({
            $or: [
                { sku: req.body.sku },
                { slug: req.body.slug }
            ]
        });

        if (existingProduct) {
            return res.status(400).json({
                success: false,
                msg: existingProduct.sku === req.body.sku 
                    ? "Ya existe un producto con este SKU"
                    : "Ya existe un producto con este slug"
            });
        }

        // Seleccionar el modelo apropiado según el tipo de producto
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

        // Crear y guardar el producto
        const product = new ProductModel(req.body);
        const savedProduct = await product.save();

        res.status(201).send({
            success: true,
            msg: "Producto creado correctamente",
            data: savedProduct
        });

    } catch (error) {
        console.error("Error al crear producto:", error);
        
        // Manejar errores de validación de MongoDB
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                msg: "Error de validación",
                errors: Object.values(error.errors).map(e => e.message)
            });
        }
        
        // Manejar errores de clave duplicada
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                msg: `Ya existe un producto con ese ${field}`,
                error: {
                    field,
                    value: error.keyValue[field]
                }
            });
        }
        
        // Error general
        res.status(500).send({
            success: false,
            msg: "Error al registrar el producto",
            error: error.message
        });
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

        // Primero, obtener el producto existente y su tipo
        const existingProduct = await ProductoBase.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                msg: 'Producto no encontrado'
            });
        }

        // Seleccionar el modelo correcto basado en el tipo de producto
        let ProductModel;
        switch (existingProduct.tipoProducto) {
            case 'ProductoCarne':
                ProductModel = ProductoCarne;
                break;
            case 'ProductoAceite':
                ProductModel = ProductoAceite;
                break;
            default:
                ProductModel = ProductoBase;
        }

        // Crear el objeto de actualización
        let updateData = {
            ...req.body,
            fechaActualizacion: new Date()
        };

        // Validar variantes de peso y sus precios si se están actualizando
        if (updateData.opcionesPeso && updateData.opcionesPeso.pesosEstandar) {
            if (!Array.isArray(updateData.opcionesPeso.pesosEstandar)) {
                return res.status(400).send({
                    success: false,
                    msg: "El campo 'opcionesPeso.pesosEstandar' debe ser un array"
                });
            }

            // Validar que cada variante tenga precio, peso y unidad
            for (let i = 0; i < updateData.opcionesPeso.pesosEstandar.length; i++) {
                const variante = updateData.opcionesPeso.pesosEstandar[i];
                
                if (!variante.precio || isNaN(Number(variante.precio))) {
                    return res.status(400).send({
                        success: false,
                        msg: `La variante ${i + 1} debe tener un precio válido`
                    });
                }

                if (!variante.peso || isNaN(Number(variante.peso))) {
                    return res.status(400).send({
                        success: false,
                        msg: `La variante ${i + 1} debe tener un peso válido`
                    });
                }

                if (!variante.unidad) {
                    return res.status(400).send({
                        success: false,
                        msg: `La variante ${i + 1} debe tener una unidad`
                    });
                }

                // Convertir precio a número si viene como string
                variante.precio = Number(variante.precio);
                
                // Asegurarse que descuentos sea un objeto válido
                if (!variante.descuentos) {
                    variante.descuentos = { regular: 0 };
                } else if (typeof variante.descuentos.regular !== 'number') {
                    variante.descuentos.regular = Number(variante.descuentos.regular) || 0;
                }
            }
        }

        // Procesar campos específicos según el tipo de producto
        if (existingProduct.tipoProducto === 'ProductoAceite') {
            updateData = {
                ...updateData,
                infoAceite: {
                    tipo: req.body.infoAceite?.tipo || existingProduct.infoAceite?.tipo,
                    volumen: Number(req.body.infoAceite?.volumen) || existingProduct.infoAceite?.volumen,
                    envase: req.body.infoAceite?.envase || existingProduct.infoAceite?.envase
                },
                caracteristicas: {
                    aditivos: Array.isArray(req.body.caracteristicas?.aditivos) 
                        ? req.body.caracteristicas.aditivos 
                        : existingProduct.caracteristicas?.aditivos || [],
                    filtracion: req.body.caracteristicas?.filtracion || existingProduct.caracteristicas?.filtracion,
                    acidez: req.body.caracteristicas?.acidez || existingProduct.caracteristicas?.acidez,
                    extraccion: req.body.caracteristicas?.extraccion || existingProduct.caracteristicas?.extraccion
                }
            };
        } else if (existingProduct.tipoProducto === 'ProductoCarne') {
            updateData = {
                ...updateData,
                infoCarne: {
                    tipoCarne: req.body.infoCarne?.tipoCarne || existingProduct.infoCarne?.tipoCarne,
                    corte: req.body.infoCarne?.corte || existingProduct.infoCarne?.corte,
                    nombreArgentino: req.body.infoCarne?.nombreArgentino || existingProduct.infoCarne?.nombreArgentino,
                    nombreChileno: req.body.infoCarne?.nombreChileno || existingProduct.infoCarne?.nombreChileno
                },
                caracteristicas: {
                    porcentajeGrasa: req.body.caracteristicas?.porcentajeGrasa || existingProduct.caracteristicas?.porcentajeGrasa,
                    marmoleo: req.body.caracteristicas?.marmoleo || existingProduct.caracteristicas?.marmoleo,
                    color: req.body.caracteristicas?.color || existingProduct.caracteristicas?.color,
                    textura: Array.isArray(req.body.caracteristicas?.textura) 
                        ? req.body.caracteristicas.textura 
                        : existingProduct.caracteristicas?.textura || []
                }
            };
        }

        // Eliminar campos que no deben actualizarse
        delete updateData._id;
        delete updateData.__v;
        delete updateData.fechaCreacion;
        delete updateData.tipoProducto; // Prevenir cambio de tipo
        delete updateData.precioFinal;
        delete updateData.precioTransferencia;

        // Actualizar el producto usando el modelo correcto
        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            updateData,
            { 
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                msg: 'Error al actualizar el producto'
            });
        }

        res.json({
            success: true,
            msg: 'Producto actualizado exitosamente',
            product: updatedProduct
        });

    } catch (error) {
        console.error('Error updating product:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                msg: 'Ya existe un producto con ese SKU o slug',
                error: error.keyValue
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
            tipoAceite,
            tags
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

        // Filtro de precio utilizando las variantes de peso
        if (precioMin !== undefined || precioMax !== undefined) {
            if (precioMin !== undefined && precioMax !== undefined) {
                filter['opcionesPeso.pesosEstandar'] = {
                    $elemMatch: {
                        precio: { $gte: Number(precioMin), $lte: Number(precioMax) }
                    }
                };
            } else if (precioMin !== undefined) {
                filter['opcionesPeso.pesosEstandar'] = {
                    $elemMatch: {
                        precio: { $gte: Number(precioMin) }
                    }
                };
            } else if (precioMax !== undefined) {
                filter['opcionesPeso.pesosEstandar'] = {
                    $elemMatch: {
                        precio: { $lte: Number(precioMax) }
                    }
                };
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