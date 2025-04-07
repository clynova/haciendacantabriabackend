import { ProductoBase } from "../models/Product.js";
import { validationResult } from 'express-validator';

/**
 * Obtener todas las etiquetas únicas del sistema
 */
const getAllTags = async (req, res) => {
    try {
        // Encuentra todas las etiquetas únicas en la colección de productos
        const allProducts = await ProductoBase.find({}, 'tags');

        // Extrae y aplana las etiquetas de todos los productos
        const allTags = allProducts.reduce((tags, product) => {
            return tags.concat(product.tags || []);
        }, []);

        // Elimina duplicados y ordena alfabéticamente
        const uniqueTags = [...new Set(allTags)].sort();

        res.status(200).send({
            success: true,
            msg: 'Etiquetas enviadas',
            tags: uniqueTags
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al obtener las etiquetas"
        });
    }
};

/**
 * Obtener etiquetas de un producto específico
 */
const getProductTags = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await ProductoBase.findById(productId);
        if (!product) {
            return res.status(404).send({
                success: false,
                msg: "El producto no existe"
            });
        }

        // Obtener las etiquetas del producto
        const tags = product.tags || [];

        res.status(200).send({
            success: true,
            msg: 'Etiquetas del producto enviadas',
            tags
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al obtener las etiquetas del producto"
        });
    }
};

/**
 * Añadir etiquetas a un producto
 */
const addTagsToProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({
                success: false,
                msg: "Errores de validación",
                errors: errors.array()
            });
        }

        const { productId } = req.params;
        const { tags } = req.body;

        if (!Array.isArray(tags)) {
            return res.status(400).send({
                success: false,
                msg: "El campo 'tags' debe ser un array de strings"
            });
        }

        // Validar que todos los elementos sean strings y aplicar trim
        const validTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
            .map(tag => tag.trim());

        const product = await ProductoBase.findById(productId);
        if (!product) {
            return res.status(404).send({
                success: false,
                msg: "El producto no existe"
            });
        }

        // Inicializar tags si no existen
        if (!product.tags) {
            product.tags = [];
        }

        // Añadir sólo etiquetas que no existan ya en el producto
        const newTags = validTags.filter(tag => !product.tags.includes(tag));
        product.tags = [...product.tags, ...newTags];

        // Guardar el producto
        await product.save();

        res.status(200).send({
            success: true,
            msg: "Etiquetas añadidas correctamente",
            data: {
                productId: product._id,
                tags: product.tags
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al añadir etiquetas al producto"
        });
    }
};

/**
 * Actualizar todas las etiquetas de un producto (reemplazar)
 */
const updateProductTags = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({
                success: false,
                msg: "Errores de validación",
                errors: errors.array()
            });
        }

        const { productId } = req.params;
        const { tags } = req.body;

        if (!Array.isArray(tags)) {
            return res.status(400).send({
                success: false,
                msg: "El campo 'tags' debe ser un array de strings"
            });
        }

        // Validar que todos los elementos sean strings y aplicar trim
        const validTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
            .map(tag => tag.trim());

        const product = await ProductoBase.findById(productId);
        if (!product) {
            return res.status(404).send({
                success: false,
                msg: "El producto no existe"
            });
        }

        // Reemplazar todas las etiquetas
        product.tags = validTags;
        await product.save();

        res.status(200).send({
            success: true,
            msg: "Etiquetas actualizadas correctamente",
            data: {
                productId: product._id,
                tags: product.tags
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al actualizar las etiquetas del producto"
        });
    }
};

/**
 * Eliminar etiquetas específicas de un producto
 */
const removeTagsFromProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({
                success: false,
                msg: "Errores de validación",
                errors: errors.array()
            });
        }

        const { productId } = req.params;
        const { tags } = req.body;

        if (!Array.isArray(tags)) {
            return res.status(400).send({
                success: false,
                msg: "El campo 'tags' debe ser un array de strings"
            });
        }

        const product = await ProductoBase.findById(productId);
        if (!product) {
            return res.status(404).send({
                success: false,
                msg: "El producto no existe"
            });
        }

        // Verificar si existen etiquetas
        if (!product.tags || product.tags.length === 0) {
            return res.status(200).send({
                success: true,
                msg: "El producto no tiene etiquetas para eliminar",
                data: {
                    productId: product._id,
                    tags: []
                }
            });
        }

        // Eliminar las etiquetas especificadas
        product.tags = product.tags.filter(tag => !tags.includes(tag));

        // Guardar el producto
        await product.save();

        res.status(200).send({
            success: true,
            msg: "Etiquetas eliminadas correctamente",
            data: {
                productId: product._id,
                tags: product.tags
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al eliminar etiquetas del producto"
        });
    }
};

/**
 * Buscar productos por etiquetas
 */
const findProductsByTags = async (req, res) => {
    try {
        const { tags, matchAll = 'true', page = 1, limit = 10, exact = 'false' } = req.query;

        if (!tags) {
            return res.status(400).send({
                success: false,
                msg: "Se requiere al menos una etiqueta para la búsqueda"
            });
        }

        // Convertir a array si viene como string
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');

        // Convertir page y limit a números
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Calcular el número de documentos a omitir
        const skip = (pageNum - 1) * limitNum;

        // Construir la consulta
        let query = {};

        if (exact === 'true') {
            // Búsqueda exacta: el array de tags debe tener exactamente los mismos elementos
            // Para esto, necesitamos recuperar todos los productos y filtrar manualmente
            const allProducts = await ProductoBase.find();

            const filteredProducts = allProducts.filter(product => {
                // Verificar si el producto tiene tags
                if (!product.tags || !Array.isArray(product.tags)) {
                    return false;
                }

                // Para que sea exacto:
                // 1. Debe tener la misma cantidad de tags
                if (product.tags.length !== tagArray.length) {
                    return false;
                }

                // product active
                if (!product.estado) {
                    return false;
                }

                // 2. Todos los tags solicitados deben estar presentes
                const hasAllTags = tagArray.every(tag => product.tags.includes(tag));

                return hasAllTags;
            });

            // Aplicar paginación manualmente
            const totalProducts = filteredProducts.length;
            const paginatedProducts = filteredProducts.slice(skip, skip + limitNum);

            return res.status(200).send({
                success: true,
                msg: "Productos con exactamente las mismas etiquetas",
                pagination: {
                    total: totalProducts,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalProducts / limitNum)
                },
                count: paginatedProducts.length,
                products: paginatedProducts
            });
        } else {
            // Búsqueda normal con $all o $in
            if (matchAll === 'true') {
                // Todos los tags deben estar presentes (AND)
                query = { tags: { $all: tagArray } };
            } else {
                // Al menos un tag debe estar presente (OR)
                query = { tags: { $in: tagArray } };
            }

            // Ejecutar la consulta con paginación
            const totalProducts = await ProductoBase.countDocuments(query);
            const products = await ProductoBase.find(query)
                .skip(skip)
                .limit(limitNum);

            res.status(200).send({
                success: true,
                msg: matchAll === 'true' ?
                    "Productos que coinciden con todas las etiquetas" :
                    "Productos que coinciden con al menos una etiqueta",
                pagination: {
                    total: totalProducts,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(totalProducts / limitNum)
                },
                count: products.length,
                products
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al buscar productos por etiquetas"
        });
    }
};

/**
 * Buscar todos los productos por etiquetas sin paginación
 */
const findAllProductsByTags = async (req, res) => {
    try {
        const { tags, matchAll = 'true', limit = 10, exact = 'false' } = req.query;

        if (!tags) {
            return res.status(400).send({
                success: false,
                msg: "Se requiere al menos una etiqueta para la búsqueda"
            });
        }

        // Convertir a array si viene como string
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        const limitNum = parseInt(limit);

        // Construir la consulta
        let query = { estado: true }; // Añadimos filtro de productos activos

        if (exact === 'true') {
            // Búsqueda exacta: el array de tags debe tener exactamente los mismos elementos
            const allProducts = await ProductoBase.find({ estado: true });

            const filteredProducts = allProducts.filter(product => {
                // Verificar si el producto tiene tags
                if (!product.tags || !Array.isArray(product.tags)) {
                    return false;
                }

                // Para que sea exacto:
                // 1. Debe tener la misma cantidad de tags
                if (product.tags.length !== tagArray.length) {
                    return false;
                }

                // 2. Todos los tags solicitados deben estar presentes
                const hasAllTags = tagArray.every(tag => product.tags.includes(tag));

                return hasAllTags;
            }).slice(0, limitNum);

            return res.status(200).send({
                success: true,
                msg: "Productos con exactamente las mismas etiquetas",
                count: filteredProducts.length,
                products: filteredProducts
            });
        } else {
            // Búsqueda normal con $all o $in
            if (matchAll === 'true') {
                // Todos los tags deben estar presentes (AND)
                query.tags = { $all: tagArray };
            } else {
                // Al menos un tag debe estar presente (OR)
                query.tags = { $in: tagArray };
            }

            // Ejecutar la consulta sin paginación pero con límite
            const products = await ProductoBase.find(query).limit(limitNum);

            res.status(200).send({
                success: true,
                msg: matchAll === 'true' ?
                    "Productos que coinciden con todas las etiquetas" :
                    "Productos que coinciden con al menos una etiqueta",
                count: products.length,
                products
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al buscar productos por etiquetas"
        });
    }
};

/**
 * Renombrar una etiqueta en todo el sistema
 */
const renameTag = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send({
                success: false,
                msg: "Errores de validación",
                errors: errors.array()
            });
        }

        const { oldTag, newTag } = req.body;

        if (!oldTag || !newTag || typeof oldTag !== 'string' || typeof newTag !== 'string') {
            return res.status(400).send({
                success: false,
                msg: "Se requieren los campos 'oldTag' y 'newTag' como strings"
            });
        }

        // Buscar todos los productos que tienen la etiqueta antigua
        const productsToUpdate = await ProductoBase.find({ tags: oldTag });
        let updatedCount = 0;

        // Actualizar la etiqueta en cada producto
        const updatePromises = productsToUpdate.map(product => {
            const tagIndex = product.tags.indexOf(oldTag);

            if (tagIndex !== -1) {
                product.tags[tagIndex] = newTag;
                updatedCount++;
                return product.save();
            }
            return Promise.resolve();
        });

        await Promise.all(updatePromises);

        res.status(200).send({
            success: true,
            msg: "Etiqueta renombrada correctamente",
            data: {
                oldTag,
                newTag,
                productsUpdated: updatedCount
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al renombrar la etiqueta"
        });
    }
};

/**
 * Eliminar una etiqueta de todo el sistema
 */
const deleteTag = async (req, res) => {
    try {
        const { tag } = req.params;

        if (!tag) {
            return res.status(400).send({
                success: false,
                msg: "Se requiere especificar la etiqueta a eliminar"
            });
        }

        // Usar updateMany para eliminar la etiqueta de todos los productos
        const result = await ProductoBase.updateMany(
            { tags: tag },
            { $pull: { tags: tag } }
        );

        res.status(200).send({
            success: true,
            msg: "Etiqueta eliminada correctamente",
            data: {
                tag,
                productsUpdated: result.modifiedCount
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            msg: "Error al eliminar la etiqueta"
        });
    }
};

export {
    getAllTags,
    getProductTags,
    addTagsToProduct,
    updateProductTags,
    removeTagsFromProduct,
    findProductsByTags,
    findAllProductsByTags,
    renameTag,
    deleteTag
};