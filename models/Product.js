import mongoose from "mongoose";
const { Schema, model } = mongoose;

// Enums
const CategoriaProducto = ['CARNE', 'ACEITE', 'CONDIMENTO', 'ACCESORIO', 'OTRO'];
const TipoCarne = ['VACUNO', 'CERDO', 'POLLO', 'CORDERO', 'PAVO'];
const CorteVacuno = [
    // Cortes Argentinos
    'BIFE_ANCHO', 'BIFE_ANGOSTO', 'BIFE_DE_PALETA', 'BIFE_DE_VACIO',
    'BOLA_DE_LOMO', 'BRAZUELO', 'CARNAZA_DE_CUADRADA', 'CARNAZA_PALETA',
    'CHINGOLO', 'COGOTE', 'COLITA_DE_CUADRIL', 'CORAZON_DE_CUADRIL',
    'ENTRAÑA_FINA', 'FALDA_DESHUESADA', 'GARRON', 'HUACHALOMO',
    'LOMO', 'MARUCHA', 'NALGA_DE_ADENTRO', 'PECETO',
    'PECHO', 'SOBRECOSTILLA', 'TAPA_DE_BIFE_ANCHO', 'TAPA_DE_CUADRIL',
    'TORTUGUITA', 'VACIO',

    // Cortes Chilenos
    'LOMO_VETADO', 'LOMO_LISO', 'ASADO_DEL_CARNICERO', 'PALANCA',
    'POSTA_ROSADA', 'OSOBUCO_DE_MANO', 'GANSO', 'POSTA_DE_PALETA',
    'CHOCLILLO', 'PUNTA_PICANA', 'ASIENTO', 'ENTRAÑA',
    'ALETILLA', 'OSOBUCO_DE_PIERNA', 'FILETE', 'PUNTA_DE_PALETA',
    'POSTA_NEGRA', 'POLLO_DE_GANSO', 'TAPAPECHO', 'PLATEADA',
    'PUNTA_DE_GANSO', 'ABASTERO', 'TAPABARRIGA',

    // Adicionales para carne molida
    'MOLIDA_ESPECIAL', 'MOLIDA_CORRIENTE'
];

const TipoAceite = ['MARAVILLA', 'OLIVA', 'CANOLA', 'MIXTO'];
const MetodoCoccion = ['PARRILLA', 'SARTEN', 'HORNO', 'COCCION_LENTA', 'SOUS_VIDE', 'GUISO'];
const TipoEnvase = ['VACIO', 'CAJA', 'BOTELLA', 'BIDON', 'BOLSA'];

// Base Product Schema
const EsquemaProductoBase = new Schema({
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    categoria: {
        type: String,
        enum: CategoriaProducto,
        required: true
    },
    estado: {
        type: Boolean,
        default: false
    },
    destacado: {
        type: Boolean,
        default: false
    },
    descripcion: {
        corta: {
            type: String,
            maxlength: 160
        },
        completa: {
            type: String
        }
    },
    precios: {
        base: {
            type: Number,
            required: true,
            min: 0
        },
        descuentos: {
            regular: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            }
        }
    },
    multimedia: {
        imagenes: [{
            url: {
                type: String,
                required: true
            },
            textoAlternativo: String,
            esPrincipal: {
                type: Boolean,
                default: false
            }
        }],
        video: String
    },
    seo: {
        metaTitulo: String,
        metaDescripcion: {
            type: String,
            maxlength: 160
        },
        palabrasClave: [String]
    },
    infoAdicional: {
        origen: String,
        marca: String,
        certificaciones: [String]
    },
    conservacion: {
        requiereRefrigeracion: {
            type: Boolean,
            default: false
        },
        requiereCongelacion: {
            type: Boolean,
            default: false
        },
        vidaUtil: String,
        instrucciones: String
    },
    metadatos: {
        type: Map,
        of: Schema.Types.Mixed
    },
    opcionesPeso: {
        esPesoVariable: {
            type: Boolean,
            default: true
        },
        pesoPromedio: Number,
        pesoMinimo: Number,
        pesoMaximo: Number,
        pesosEstandar: [{
            peso: Number,
            unidad: {
                type: String,
                enum: ['g', 'kg', 'ml', 'L', 'unidades'],
                default: 'g'
            },
            esPredeterminado: {
                type: Boolean,
                default: false
            },
            precio: Number,
            sku: String,
            stockDisponible: {
                type: Number,
                min: 0,
                default: 0
            }, // Stock específico para esta variante
            umbralStockBajo: {
                type: Number,
                default: 5
            }, // Umbral de stock bajo para esta variante
            ultimaActualizacion: {
                type: Date,
                default: Date.now
            } // Última actualización del stock
        }],
        rangosPreferidos: [{
            nombre: String,
            pesoMinimo: {
                type: Number,
                required: true
            },
            pesoMaximo: {
                type: Number,
                required: true
            },
            descripcion: String,
            esPredeterminado: {
                type: Boolean,
                default: false
            }
        }]
    },
    tags: [{ type: String, trim: true }],
    fechaCreacion: { type: Date, default: Date.now },
    fechaActualizacion: { type: Date, default: Date.now }
}, {
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
    discriminatorKey: 'tipoProducto',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false // Desactiva la conversión de _id a id
});

// Meat Product Schema
const EsquemaProductoCarne = new Schema({
    infoCarne: {
        tipoCarne: {
            type: String,
            enum: TipoCarne,
            required: true
        },
        corte: {
            type: String,
            enum: CorteVacuno
        },
        nombreArgentino: String,
        nombreChileno: String
    },
    caracteristicas: {
        porcentajeGrasa: {
            type: Number,
            min: 0,
            max: 100
        },
        marmoleo: {
            type: Number,
            min: 1,
            max: 5
        },
        color: String,
        textura: [String]
    },
    infoNutricional: {
        porcion: String,
        calorias: Number,
        proteinas: Number,
        grasaTotal: Number,
        grasaSaturada: Number,
        colesterol: Number,
        sodio: Number,
        carbohidratos: Number
    },
    coccion: {
        metodos: [{
            type: String,
            enum: MetodoCoccion
        }],
        temperaturaIdeal: String,
        tiempoEstimado: String,
        consejos: [String],
        recetas: [{
            nombre: String,
            url: String,
            descripcion: String
        }]
    },
    empaque: {
        tipo: {
            type: String,
            enum: TipoEnvase,
            default: 'VACIO'
        },
        unidadesPorCaja: Number,
        pesoCaja: Number
    },
    origen: {
        pais: String,
        region: String,
        productor: String,
        raza: String,
        maduracion: String
    },
    procesamiento: {
        fechaFaenado: Date,
        fechaEnvasado: Date,
        fechaVencimiento: Date,
        numeroLote: String
    },

});

// Oil Product Schema
const EsquemaProductoAceite = new Schema({
    infoAceite: {
        tipo: {
            type: String,
            enum: TipoAceite,
            required: true
        },
        envase: {
            type: String,
            enum: TipoEnvase
        }
    },
    caracteristicas: {
        aditivos: [String],
        filtracion: String,
        acidez: String,
        extraccion: String
    },
    infoNutricional: {
        porcion: String,
        calorias: Number,
        grasaTotal: Number,
        grasaSaturada: Number,
        grasaTrans: Number,
        grasaPoliinsaturada: Number,
        grasaMonoinsaturada: Number
    },
    usosRecomendados: [String],
    produccion: {
        metodo: String,
        temperatura: String,
        fechaEnvasado: Date,
        fechaVencimiento: Date
    }
});

// Virtuals
EsquemaProductoBase.virtual('precioFinal').get(function () {
    const precioBase = this.precios.base;
    const descuentoRegular = this.precios.descuentos.regular || 0;
    return precioBase * (1 - (descuentoRegular / 100));
});

EsquemaProductoBase.virtual('precioTransferencia').get(function () {
    const precioBase = this.precios.base;
    const descuentoRegular = this.precios.descuentos.regular || 0;
    const descuentoTransferencia = this.precios.descuentos.transferencia || 0;
    return precioBase * (1 - ((descuentoRegular + descuentoTransferencia) / 100));
});

EsquemaProductoCarne.virtual('precioPorKgFinal').get(function () {
    const precioPorKg = this.infoCarne.precioPorKg;
    const descuentoRegular = this.precios.descuentos.regular || 0;
    return precioPorKg * (1 - (descuentoRegular / 100));
});

EsquemaProductoCarne.virtual('precioPorKgTransferencia').get(function () {
    const precioPorKg = this.infoCarne.precioPorKg;
    const descuentoRegular = this.precios.descuentos.regular || 0;
    const descuentoTransferencia = this.precios.descuentos.transferencia || 0;
    return precioPorKg * (1 - ((descuentoRegular + descuentoTransferencia) / 100));
});

// Middleware
EsquemaProductoBase.pre('save', function (next) {
    this.fechaActualizacion = new Date();
    next();
});

EsquemaProductoBase.pre('save', function (next) {
    if (!this.slug) {
        this.slug = this.nombre
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
    next();
});

// Models
const ProductoBase = mongoose.model('Producto', EsquemaProductoBase);
const ProductoCarne = ProductoBase.discriminator('ProductoCarne', EsquemaProductoCarne);
const ProductoAceite = ProductoBase.discriminator('ProductoAceite', EsquemaProductoAceite);

export { ProductoBase, ProductoCarne, ProductoAceite, CategoriaProducto, TipoCarne, CorteVacuno, TipoAceite, MetodoCoccion, TipoEnvase };
