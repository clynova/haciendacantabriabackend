const apiEndpoints = {
    'Usuarios': [
        { 
            method: 'POST', 
            path: '/api/user/registrar', 
            description: 'Registrar nuevo usuario',
            info: 'Envia un JSON con name, email y password.'
        },
        { 
            method: 'POST', 
            path: '/api/user/confirmar', 
            description: 'Confirmar cuenta de usuario',
            info: 'Requiere email y token de confirmación.'
        },
        { 
            method: 'POST', 
            path: '/api/user/autenticar', 
            description: 'Iniciar sesión',
            info: 'Envia un JSON con email y password.'
        },
        { 
            method: 'GET', 
            path: '/api/user/logout', 
            description: 'Cerrar sesión',
            info: 'Invalida el token de autenticación actual.'
        },
        { 
            method: 'GET', 
            path: '/api/user/validate-token', 
            description: 'Validar token',
            info: 'Verifica si el token actual es válido.'
        },
        { 
            method: 'POST', 
            path: '/api/user/reset-password', 
            description: 'Solicitar restablecimiento de contraseña',
            info: 'Envia email con instrucciones.'
        },
        { 
            method: 'GET', 
            path: '/api/user/reset-password/:token', 
            description: 'Verificar token de restablecimiento',
            info: 'Valida el token de restablecimiento de contraseña.'
        },
        { 
            method: 'POST', 
            path: '/api/user/reset-password/:token', 
            description: 'Establecer nueva contraseña',
            info: 'Envia un JSON con la nueva contraseña.'
        },
        { 
            method: 'GET', 
            path: '/api/user/perfil', 
            description: 'Obtener perfil del usuario autenticado',
            info: 'Requiere token de autenticación.'
        },
        { 
            method: 'POST', 
            path: '/api/user/perfil', 
            description: 'Obtener perfil de usuario específico',
            info: 'Solo para administradores.'
        },
        { 
            method: 'PUT', 
            path: '/api/user/perfil', 
            description: 'Actualizar perfil',
            info: 'Actualiza información del perfil del usuario autenticado.'
        },
        { 
            method: 'PUT', 
            path: '/api/user/change-password', 
            description: 'Cambiar contraseña',
            info: 'Requiere contraseña actual y nueva.'
        },
        { 
            method: 'DELETE', 
            path: '/api/user/delete-account/:userId', 
            description: 'Eliminar cuenta',
            info: 'Elimina cuenta propia o de otro usuario si es admin.'
        },
        { 
            method: 'GET', 
            path: '/api/user/all', 
            description: 'Listar usuarios',
            info: 'Solo para administradores.'
        },
        { 
            method: 'POST', 
            path: '/api/user/addresses', 
            description: 'Agregar dirección',
            info: 'Añade una nueva dirección al perfil del usuario.'
        },
        { 
            method: 'GET', 
            path: '/api/user/addresses', 
            description: 'Obtener direcciones',
            info: 'Lista todas las direcciones del usuario.'
        },
        { 
            method: 'PUT', 
            path: '/api/user/addresses/:addressId', 
            description: 'Actualizar dirección',
            info: 'Modifica una dirección existente.'
        },
        { 
            method: 'DELETE', 
            path: '/api/user/addresses/:addressId', 
            description: 'Eliminar dirección',
            info: 'Elimina una dirección del perfil.'
        },
        { 
            method: 'PUT', 
            path: '/api/user/addresses/:addressId/active', 
            description: 'Establecer dirección activa',
            info: 'Define una dirección como la principal.'
        }
    ],
    'Productos': [
        { 
            method: 'GET', 
            path: '/api/product/active', 
            description: 'Obtener productos activos',
            info: 'Lista todos los productos disponibles.'
        },
        { 
            method: 'GET', 
            path: '/api/product/search', 
            description: 'Buscar productos',
            info: 'Búsqueda con filtros por nombre, categoría, etc.'
        },
        { 
            method: 'GET', 
            path: '/api/product/:_id', 
            description: 'Obtener producto por ID',
            info: 'Detalles de un producto específico.'
        },
        { 
            method: 'GET', 
            path: '/api/product/admin/all', 
            description: 'Listar todos los productos (admin)',
            info: 'Incluye productos activos e inactivos.'
        },
        { 
            method: 'POST', 
            path: '/api/product', 
            description: 'Crear producto',
            info: 'Solo administradores.'
        },
        { 
            method: 'PUT', 
            path: '/api/product/:_id', 
            description: 'Actualizar producto',
            info: 'Solo administradores.'
        },
        { 
            method: 'DELETE', 
            path: '/api/product/:_id', 
            description: 'Eliminar producto',
            info: 'Solo administradores.'
        },
        { 
            method: 'PUT', 
            path: '/api/product/:_id/status', 
            description: 'Actualizar estado del producto',
            info: 'Activar/desactivar producto (admin).'
        },
        { 
            method: 'POST', 
            path: '/api/product/:_id/notificar-favoritos', 
            description: 'Notificar a favoritos',
            info: 'Envía notificación a usuarios con el producto en favoritos.'
        }
    ],
    'Carrito': [
        { 
            method: 'GET', 
            path: '/api/cart', 
            description: 'Ver carrito',
            info: 'Muestra el carrito del usuario actual.'
        },
        { 
            method: 'POST', 
            path: '/api/cart', 
            description: 'Agregar al carrito',
            info: 'Añade un producto al carrito.'
        },
        { 
            method: 'PATCH', 
            path: '/api/cart/:productId', 
            description: 'Actualizar cantidad',
            info: 'Modifica la cantidad de un producto.'
        },
        { 
            method: 'DELETE', 
            path: '/api/cart', 
            description: 'Vaciar carrito',
            info: 'Elimina todos los productos del carrito.'
        },
        { 
            method: 'DELETE', 
            path: '/api/cart/:productId', 
            description: 'Eliminar producto',
            info: 'Remueve un producto específico del carrito.'
        }
    ],
    'Lista de Deseos': [
        { 
            method: 'GET', 
            path: '/api/wishlist', 
            description: 'Ver lista de deseos',
            info: 'Muestra los productos guardados en favoritos.'
        },
        { 
            method: 'POST', 
            path: '/api/wishlist/add', 
            description: 'Agregar a favoritos',
            info: 'Añade un producto a la lista de deseos.'
        },
        { 
            method: 'DELETE', 
            path: '/api/wishlist/remove/:productId', 
            description: 'Quitar de favoritos',
            info: 'Elimina un producto de la lista de deseos.'
        },
        { 
            method: 'DELETE', 
            path: '/api/wishlist/clear', 
            description: 'Limpiar lista',
            info: 'Elimina todos los productos de la lista de deseos.'
        }
    ],
    'Etiquetas': [
        { 
            method: 'GET', 
            path: '/api/tags', 
            description: 'Obtener todas las etiquetas',
            info: 'Lista todas las etiquetas disponibles.'
        },
        { 
            method: 'GET', 
            path: '/api/tags/products', 
            description: 'Buscar por etiquetas',
            info: 'Encuentra productos por sus etiquetas.'
        },
        { 
            method: 'GET', 
            path: '/api/tags/products/all', 
            description: 'Buscar todos por etiquetas',
            info: 'Búsqueda completa de productos por etiquetas.'
        },
        { 
            method: 'GET', 
            path: '/api/tags/product/:productId', 
            description: 'Etiquetas de producto',
            info: 'Lista las etiquetas de un producto específico.'
        },
        { 
            method: 'POST', 
            path: '/api/tags/product/:productId', 
            description: 'Agregar etiquetas',
            info: 'Añade etiquetas a un producto (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/tags/product/:productId', 
            description: 'Actualizar etiquetas',
            info: 'Modifica las etiquetas de un producto (admin).'
        },
        { 
            method: 'DELETE', 
            path: '/api/tags/product/:productId', 
            description: 'Eliminar etiquetas',
            info: 'Remueve etiquetas de un producto (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/tags/rename', 
            description: 'Renombrar etiqueta',
            info: 'Cambia el nombre de una etiqueta (admin).'
        },
        { 
            method: 'DELETE', 
            path: '/api/tags/:tag', 
            description: 'Eliminar etiqueta',
            info: 'Elimina una etiqueta del sistema (admin).'
        }
    ],
    'Métodos de Pago': [
        { 
            method: 'GET', 
            path: '/api/payment-methods', 
            description: 'Listar métodos de pago',
            info: 'Obtiene todos los métodos de pago disponibles.'
        },
        { 
            method: 'GET', 
            path: '/api/payment-methods/:_id', 
            description: 'Obtener método de pago',
            info: 'Detalles de un método de pago específico.'
        },
        { 
            method: 'GET', 
            path: '/api/payment-methods/admin/all', 
            description: 'Listar todos (admin)',
            info: 'Lista completa de métodos de pago para administración.'
        },
        { 
            method: 'POST', 
            path: '/api/payment-methods', 
            description: 'Crear método de pago',
            info: 'Añade un nuevo método de pago (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/payment-methods/:_id', 
            description: 'Actualizar método de pago',
            info: 'Modifica un método de pago existente (admin).'
        },
        { 
            method: 'DELETE', 
            path: '/api/payment-methods/:_id', 
            description: 'Eliminar método de pago',
            info: 'Desactiva un método de pago (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/payment-methods/restore/:_id', 
            description: 'Restaurar método de pago',
            info: 'Reactiva un método de pago eliminado (admin).'
        }
    ],
    'Métodos de Envío': [
        { 
            method: 'GET', 
            path: '/api/shipping-methods', 
            description: 'Listar métodos de envío',
            info: 'Obtiene todos los métodos de envío disponibles.'
        },
        { 
            method: 'GET', 
            path: '/api/shipping-methods/:_id', 
            description: 'Obtener método de envío',
            info: 'Detalles de un método de envío específico.'
        },
        { 
            method: 'POST', 
            path: '/api/shipping-methods', 
            description: 'Crear método de envío',
            info: 'Añade un nuevo método de envío (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/shipping-methods/:_id', 
            description: 'Actualizar método de envío',
            info: 'Modifica un método de envío existente (admin).'
        },
        { 
            method: 'DELETE', 
            path: '/api/shipping-methods/:_id', 
            description: 'Eliminar método de envío',
            info: 'Desactiva un método de envío (admin).'
        }
    ],
    'Pedidos': [
        { 
            method: 'POST', 
            path: '/api/order', 
            description: 'Crear pedido',
            info: 'Crea un nuevo pedido para el usuario actual.'
        },
        { 
            method: 'GET', 
            path: '/api/order/user', 
            description: 'Ver pedidos propios',
            info: 'Lista los pedidos del usuario autenticado.'
        },
        { 
            method: 'GET', 
            path: '/api/order/user/:orderId', 
            description: 'Ver detalle de pedido',
            info: 'Muestra los detalles de un pedido específico.'
        },
        { 
            method: 'POST', 
            path: '/api/order/from-quotation', 
            description: 'Crear pedido desde cotización',
            info: 'Convierte una cotización en pedido.'
        },
        { 
            method: 'GET', 
            path: '/api/order/all', 
            description: 'Ver todos los pedidos',
            info: 'Lista todos los pedidos (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/order/:orderId', 
            description: 'Actualizar pedido',
            info: 'Modifica un pedido existente (admin).'
        },
        { 
            method: 'DELETE', 
            path: '/api/order/:orderId', 
            description: 'Cancelar pedido',
            info: 'Cancela un pedido existente (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/order/:orderId/status', 
            description: 'Actualizar estado',
            info: 'Modifica el estado del pedido (admin).'
        }
    ],
    'Cotizaciones': [
        { 
            method: 'POST', 
            path: '/api/quotations', 
            description: 'Crear cotización',
            info: 'Genera una nueva cotización.'
        },
        { 
            method: 'GET', 
            path: '/api/quotations/user', 
            description: 'Ver cotizaciones propias',
            info: 'Lista las cotizaciones del usuario.'
        },
        { 
            method: 'GET', 
            path: '/api/quotations/all', 
            description: 'Ver todas las cotizaciones',
            info: 'Lista todas las cotizaciones (admin).'
        },
        { 
            method: 'GET', 
            path: '/api/quotations/:quotationId', 
            description: 'Ver detalle de cotización',
            info: 'Muestra los detalles de una cotización específica.'
        },
        { 
            method: 'PUT', 
            path: '/api/quotations/:_id', 
            description: 'Actualizar cotización',
            info: 'Modifica una cotización existente (admin).'
        },
        { 
            method: 'DELETE', 
            path: '/api/quotations/:_id', 
            description: 'Eliminar cotización',
            info: 'Elimina una cotización (admin).'
        }
    ],
    'Procesamiento de Pagos': [
        { 
            method: 'POST', 
            path: '/api/payments/update-return-url', 
            description: 'Actualizar URL de retorno',
            info: 'Configura la URL de retorno para pagos (admin).'
        },
        { 
            method: 'POST', 
            path: '/api/payments/initiate/:orderId', 
            description: 'Iniciar pago',
            info: 'Comienza el proceso de pago para un pedido.'
        },
        { 
            method: 'GET', 
            path: '/api/payments/status/:orderId', 
            description: 'Estado del pago',
            info: 'Consulta el estado de un pago.'
        },
        { 
            method: 'GET', 
            path: '/api/payments/webpay/return', 
            description: 'Retorno WebPay',
            info: 'Endpoint para retorno de WebPay.'
        },
        { 
            method: 'POST', 
            path: '/api/payments/webpay/return', 
            description: 'Retorno WebPay (POST)',
            info: 'Endpoint alternativo para retorno de WebPay.'
        }
    ],
    'Regiones': [
        { 
            method: 'GET', 
            path: '/api/regions', 
            description: 'Listar regiones activas',
            info: 'Obtiene todas las regiones disponibles.'
        },
        { 
            method: 'GET', 
            path: '/api/regions/all', 
            description: 'Listar todas las regiones',
            info: 'Obtiene todas las regiones incluyendo inactivas.'
        },
        { 
            method: 'GET', 
            path: '/api/regions/:id', 
            description: 'Obtener región',
            info: 'Detalles de una región específica.'
        },
        { 
            method: 'POST', 
            path: '/api/regions', 
            description: 'Crear región',
            info: 'Añade una nueva región (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/regions/:id', 
            description: 'Actualizar región',
            info: 'Modifica una región existente (admin).'
        },
        { 
            method: 'DELETE', 
            path: '/api/regions/:id', 
            description: 'Eliminar región',
            info: 'Elimina una región (admin).'
        },
        { 
            method: 'PUT', 
            path: '/api/regions/:id/status', 
            description: 'Actualizar estado',
            info: 'Cambia el estado activo/inactivo de una región (admin).'
        }
    ],
    'Utilidades': [
        { 
            method: 'GET', 
            path: '/api/util/getdashboardstats', 
            description: 'Estadísticas del dashboard',
            info: 'Obtiene estadísticas generales del sistema.'
        },
        { 
            method: 'GET', 
            path: '/api/util/top-tags', 
            description: 'Etiquetas más usadas',
            info: 'Lista las etiquetas más populares.'
        },
        { 
            method: 'GET', 
            path: '/api/util/total-sales', 
            description: 'Total de ventas',
            info: 'Obtiene el total de ventas realizadas.'
        },
        { 
            method: 'GET', 
            path: '/api/util/quotation-stats', 
            description: 'Estadísticas de cotizaciones',
            info: 'Métricas sobre las cotizaciones.'
        },
        { 
            method: 'GET', 
            path: '/api/util/order-stats', 
            description: 'Estadísticas de pedidos',
            info: 'Métricas sobre los pedidos.'
        },
        { 
            method: 'POST', 
            path: '/api/util/contact', 
            description: 'Formulario de contacto',
            info: 'Procesa mensajes del formulario de contacto.'
        },
        { 
            method: 'GET', 
            path: '/api/util/send-emailOrder/:orderId', 
            description: 'Enviar email de confirmación',
            info: 'Reenvía el email de confirmación de un pedido.'
        }
    ]
};

export const getApiDocs = () => {
    return Object.entries(apiEndpoints).map(([section, endpoints]) => `
        <h2>${section}</h2>
        ${endpoints.map(endpoint => `
            <div class="endpoint">
                <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                <code>${endpoint.path}</code>
                <div class="description">${endpoint.description}</div>
                ${endpoint.info ? `<div class="info">${endpoint.info}</div>` : ''}
            </div>
        `).join('')}
    `).join('');
};
