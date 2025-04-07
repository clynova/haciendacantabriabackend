import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del transporter de nodemailer
const createTransporter = () => {
  console.log('Iniciando configuración del transporter de email...');
  console.log('Variables de entorno:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM
  });

  // Opciones de configuración para SSL/TLS
  const options = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587, // Puerto 587 es común para TLS
    secure: process.env.EMAIL_SECURE === 'true', // Cambia a false si usas el puerto 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Configuraciones adicionales para manejar problemas de SSL/TLS
    tls: {
      // No verificar el certificado (útil para desarrollo, pero considere habilitarlo en producción)
      rejectUnauthorized: true, // Habilitar verificación SSL para producción
      // Usar versión mínima de TLS 1.2
      minVersion: 'TLSv1.2'
    }
  };

  try {
    const transporter = nodemailer.createTransport(options);
    console.log('Transporter creado exitosamente');
    return transporter;
  } catch (error) {
    console.error('Error al crear el transporter:', error);
    throw error;
  }
};

// Función para generar el HTML del email de confirmación de cuenta
const generarEmailConfirmacionHTML = ({ firstName, token, email }) => {
  const confirmationUrl = `${process.env.FRONTEND_URL}/auth/verification-pending?email=${email}&token=${token}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmación de cuenta</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 5px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px;
        }
        .header-text {
          font-size: 24px;
          font-weight: bold;
          color: #333333;
        }
        .content {
          padding: 0 20px;
        }
        .text {
          font-size: 16px;
          color: #333333;
        }
        .button-container {
          text-align: center;
          padding: 20px 0;
        }
        .button {
          background-color: #4CAF50;
          border-radius: 5px;
          color: #ffffff;
          font-size: 16px;
          font-weight: bold;
          text-decoration: none;
          text-align: center;
          display: inline-block;
          padding: 12px 24px;
        }
        .link {
          color: #4a6ee0;
          word-break: break-all;
        }
        .divider {
          border-top: 1px solid #e0e0e0;
          margin: 20px 0;
        }
        .footer {
          padding: 0 20px;
          text-align: center;
        }
        .footer-text {
          font-size: 14px;
          color: #808080;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-text">Bienvenido(a) a Hacienda Cantabria</div>
        </div>
        
        <div class="content">
          <p class="text">Hola ${firstName},</p>
          <p class="text">Gracias por registrarte en Hacienda Cantabria. Para confirmar tu cuenta, por favor haz clic en el botón de abajo:</p>
        </div>
        
        <div class="button-container">
          <p class="text">Si no puedes ver el botón, copia y pega el siguiente enlace en tu navegador:</p>          
          <a class="button" href="#">${token}</a>
        </div>
        
        <div class="content">
          <p class="text">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
          <p class="link">
            <a href="${confirmationUrl}" style="color: #4a6ee0;">${confirmationUrl}</a>
          </p>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p class="footer-text">Si no solicitaste esta cuenta, puedes ignorar este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Función para generar el HTML del email de recuperación de contraseña
const generarEmailRecuperacionHTML = ({ firstName, token }) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/restablecer/${token}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recuperación de Contraseña</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 5px;
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px;
        }
        .header-text {
          font-size: 24px;
          font-weight: bold;
          color: #333333;
        }
        .content {
          padding: 0 20px;
        }
        .text {
          font-size: 16px;
          color: #333333;
        }
        .button-container {
          text-align: center;
          padding: 20px 0;
        }
        .button {
          background-color: #4a6ee0;
          border-radius: 5px;
          color: #ffffff;
          font-size: 16px;
          font-weight: bold;
          text-decoration: none;
          text-align: center;
          display: inline-block;
          padding: 12px 24px;
        }
        .link {
          color: #4a6ee0;
          word-break: break-all;
        }
        .divider {
          border-top: 1px solid #e0e0e0;
          margin: 20px 0;
        }
        .footer {
          padding: 0 20px;
          text-align: center;
        }
        .footer-text {
          font-size: 14px;
          color: #808080;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-text">Recuperación de Contraseña</div>
        </div>
        
        <div class="content">
          <p class="text">Hola ${firstName},</p>
          <p class="text">Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        </div>
        
        <div class="button-container">
          <a class="button" href="${resetUrl}">Restablecer contraseña</a>
        </div>
        
        <div class="content">
          <p class="text">Si el botón no funciona, puedes copiar y pegar el siguiente enlace en tu navegador:</p>
          <p class="link">
            <a href="${resetUrl}" style="color: #4a6ee0;">${resetUrl}</a>
          </p>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p class="footer-text">Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.</p>
          <p class="footer-text">Este enlace expirará en 24 horas.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Función para generar el HTML del email de notificación de producto favorito
const generarEmailProductoFavoritoHTML = ({ usuario, producto }) => {
  const { firstName } = usuario;
  const { nombre, descripcion, multimedia, slug, opcionesPeso } = producto;

  // Obtener la imagen principal del producto o la primera disponible
  const imagen = multimedia?.imagenes?.find(img => img.esPrincipal)?.url ||
    multimedia?.imagenes?.[0]?.url ||
    'https://via.placeholder.com/400x300?text=Producto';

  // Obtener el precio con variante predeterminada o primera variante
  let precioFinal = 0;
  if (opcionesPeso && opcionesPeso.pesosEstandar && opcionesPeso.pesosEstandar.length > 0) {
    // Buscar la variante predeterminada o usar la primera
    const variante = opcionesPeso.pesosEstandar.find(v => v.esPredeterminado) || opcionesPeso.pesosEstandar[0];
    const precioBase = variante.precio || 0;
    const descuento = variante.descuentos?.regular || 0;
    precioFinal = precioBase * (1 - (descuento / 100));
  }

  // Crear URL del producto
  const productoUrl = `${process.env.FRONTEND_URL}/product/${slug}`;

  // Texto descriptivo (limitado a 2 líneas aproximadamente)
  const descripcionCorta = descripcion?.corta ||
    (descripcion?.completa ? descripcion.completa.substring(0, 120) + '...' : 'Descubre este increíble producto');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Producto destacado: ${nombre}</title>
      <style>
        /* Estilos para un diseño moderno y responsive */
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #2C3E50;
          padding: 30px 20px;
          text-align: center;
        }
        .header-text {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: 0.5px;
        }
        .subheader {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 5px;
        }
        .content {
          padding: 30px 20px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .product-container {
          background: #f5f7fa;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 25px;
        }
        .product-image {
          width: 100%;
          height: auto;
          border-radius: 6px;
          margin-bottom: 15px;
        }
        .product-name {
          font-size: 22px;
          font-weight: 600;
          margin: 5px 0;
        }
        .product-description {
          font-size: 16px;
          line-height: 1.5;
          color: #666;
          margin-bottom: 15px;
        }
        .product-price-container {
          margin: 15px 0;
        }
        .product-price {
          font-size: 24px;
          font-weight: bold;
          color: #2C3E50;
        }
        .button-container {
          text-align: center;
          margin: 25px 0 10px;
        }
        .button {
          display: inline-block;
          background-color: #E74C3C;
          color: white;
          font-weight: bold;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 50px;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
        }
        .button:hover {
          background-color: #C0392B;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #999;
        }
        .social-links {
          margin-bottom: 15px;
        }
        .social-icon {
          margin: 0 10px;
          display: inline-block;
          width: 32px;
          height: 32px;
        }
        
        /* Media queries para dispositivos móviles */
        @media only screen and (max-width: 480px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
          .content {
            padding: 20px 15px;
          }
          .header-text {
            font-size: 20px;
          }
          .product-name {
            font-size: 20px;
          }
          .product-price {
            font-size: 22px;
          }
          .button {
            padding: 10px 20px;
            font-size: 14px;
            width: 100%;
            box-sizing: border-box;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="header-text">¡Te interesará este producto!</h1>
          <p class="subheader">Hacienda Cantabria</p>
        </div>
        
        <div class="content">
          <p class="greeting">
          Hola ${firstName},</p>
          <div class="product-container">
            <img class="product-image" src="${imagen}" alt="${nombre}">
            <h2 class="product-name">${nombre}</h2>
            <p class="product-description">${descripcionCorta}</p>
            <div class="product-price-container">
              <span class="product-price">$${precioFinal.toFixed(2)}</span>
            </div>
          </div>
          <div class="button-container">
            <a class="button" href="${productoUrl}">Ver producto</a>
          </div>
        </div>
        
        <div class="footer">
          <p>Gracias por ser parte de Hacienda Cantabria.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envía emails a todos los usuarios que tienen un producto específico en su lista de favoritos
 * @param {string} productoId - ID del producto
 * @returns {Promise<Object>} - Resultado con el número de emails enviados y detalles
 */
const enviarEmailProductoFavorito = async (productoId) => {
  try {
    if (!productoId) {
      throw new Error('ID de producto no proporcionado');
    }

    // Importar los modelos necesarios
    const { Wishlist } = await import('../models/Wishlist.js');
    const { User } = await import('../models/User.js');
    const { ProductoBase } = await import('../models/Product.js');

    // Obtener el producto
    const producto = await ProductoBase.findById(productoId);
    if (!producto) {
      throw new Error(`Producto con ID ${productoId} no encontrado`);
    }

    // Encontrar todas las listas de deseos que incluyen este producto
    const wishlists = await Wishlist.find({
      products: { $in: [productoId] }
    }).populate('userId');

    if (!wishlists || wishlists.length === 0) {
      return {
        success: true,
        enviados: 0,
        mensaje: 'No hay usuarios con este producto en su lista de favoritos'
      };
    }

    // Configurar el transportador de email
    const transporter = createTransporter();
    const resultados = {
      success: true,
      enviados: 0,
      fallidos: 0,
      detalles: []
    };

    // Preparar y enviar emails a cada usuario
    for (const wishlist of wishlists) {
      // Verificar que tengamos información del usuario
      const usuario = wishlist.userId;
      if (!usuario || !usuario.email) {
        resultados.fallidos++;
        resultados.detalles.push({
          wishlistId: wishlist._id,
          error: 'No se pudo obtener información del usuario'
        });
        continue;
      }

      // Generar el contenido del email
      const htmlContent = generarEmailProductoFavoritoHTML({
        usuario,
        producto
      });

      // Configurar opciones del email
      const mailOptions = {
        from: `"Hacienda Cantabria" <${process.env.EMAIL_FROM}>`,
        to: usuario.email,
        subject: `¡${producto.nombre} te está esperando! 🔥`,
        html: htmlContent
      };

      try {
        // Enviar el email
        await transporter.sendMail(mailOptions);
        resultados.enviados++;
        resultados.detalles.push({
          usuarioId: usuario._id,
          email: usuario.email,
          estado: 'enviado'
        });
      } catch (error) {
        console.error(`Error al enviar email a ${usuario.email}:`, error);
        resultados.fallidos++;
        resultados.detalles.push({
          usuarioId: usuario._id,
          email: usuario.email,
          estado: 'fallido',
          error: error.message
        });
      }
    }

    return resultados;
  } catch (error) {
    console.error('Error en enviarEmailProductoFavorito:', error);
    throw error;
  }
};

// Función para enviar email de confirmación de cuenta
const enviarEmailConfirmacion = async (usuario) => {
  try {
    const { firstName, email, token } = usuario;
    console.log('Iniciando envío de email de confirmación a:', email);

    const transporter = createTransporter();
    console.log('Transporter creado');

    const emailHtml = generarEmailConfirmacionHTML({
      firstName,
      token,
      email
    });
    console.log('HTML generado');

    const info = await transporter.sendMail({
      from: `"Hacienda Cantabria" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Confirma tu cuenta en Hacienda Cantabria',
      html: emailHtml
    });

    console.log('Email de confirmación enviado:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error detallado al enviar email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};

// Función para enviar email de recuperación de contraseña
const enviarEmailRecuperacion = async (usuario) => {
  try {
    const { firstName, email, token } = usuario;

    const transporter = createTransporter();

    const emailHtml = generarEmailRecuperacionHTML({
      firstName,
      token
    });

    const info = await transporter.sendMail({
      from: `"Hacienda Cantabria" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Restablece tu contraseña en Hacienda Cantabria',
      html: emailHtml
    });

    console.log('Email de recuperación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email de recuperación:', error);
    return { success: false, error: error.message };
  }
};

// Función para generar el HTML del email de confirmación de orden de compra
const generarEmailConfirmacionOrdenHTML = async ({ order, orderDetails, usuario }) => {
  const { firstName, lastName } = usuario;
  const { _id, orderDate, status, subtotal, total, shippingAddress, shipping, payment, estimatedDeliveryDate, shippingCost, paymentCommission } = order;

  // Formatear fecha de orden
  const fechaOrden = new Date(orderDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Formatear fecha estimada de entrega
  const fechaEntrega = new Date(estimatedDeliveryDate).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Formatear estado de la orden para mostrarlo en español
  const estadosTraducidos = {
    'pending': 'Pendiente',
    'processing': 'En procesamiento',
    'completed': 'En Curso',
    'canceled': 'Cancelada',
    'finalized': 'Finalizada'
  };

  const estadoOrden = estadosTraducidos[status] || status;

  // Crear HTML para cada producto
  let productosHTML = '';

  for (const item of orderDetails) {
    // Usar la información capturada del producto al momento de la compra
    const cantidad = item.quantity;
    const precio = item.priceInfo.finalPrice;
    const subtotalItem = item.subtotal;
    const nombre = item.productSnapshot.nombre;
    const descripcion = "";
    
    // Usar la información de variante
    const variante = `${item.variant.peso} ${item.variant.unidad}`;
    
    // Usar la imagen del snapshot si está disponible
    const imagenUrl = item.productSnapshot.imagen || 'https://via.placeholder.com/80x80?text=Producto';

    productosHTML += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
          <img src="${imagenUrl}" alt="${nombre}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
          <div style="font-weight: bold;">${nombre}</div>
          <div style="color: #666; font-size: 14px; margin-top: 4px;">${variante}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${cantidad}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${precio.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${subtotalItem.toFixed(2)}</td>
      </tr>
    `;
  }

  // URL para rastrear la orden
  const orderUrl = `${process.env.FRONTEND_URL}/profile/orders/${_id}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de tu pedido #${_id}</title>
      <style>
        /* Estilos base */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f7f7f7;
          color: #333;
          line-height: 1.6;
        }
        
        /* Contenedor principal */
        .container {
          max-width: 650px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
        }
        
        /* Cabecera */
        .header {
          background-color: #2C3E50;
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        
        .header-text {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          letter-spacing: 0.2px;
        }
        
        .subheader {
          margin-top: 5px;
          font-size: 16px;
          opacity: 0.9;
        }
        
        /* Contenido */
        .content {
          padding: 30px 25px;
        }
        
        .greeting {
          font-size: 18px;
          margin-bottom: 25px;
        }
        
        /* Secciones */
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        /* Información de la orden */
        .order-info {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
        }
        
        .order-info-item {
          margin-bottom: 10px;
          display: flex;
          flex-wrap: wrap;
        }
        
        .order-info-label {
          font-weight: 600;
          width: 180px;
          margin-right: 10px;
        }
        
        .order-info-value {
          flex: 1;
        }
        
        /* Tabla de productos */
        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .products-table th {
          background-color: #f5f5f5;
          padding: 12px 10px;
          text-align: left;
          font-weight: 600;
        }
        
        /* Resumen */
        .summary {
          margin-top: 20px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 15px;
        }
        
        .summary-row.total {
          font-weight: 700;
          font-size: 18px;
          background-color: #f9f9f9;
          padding: 12px 15px;
          margin-top: 8px;
          border-radius: 6px;
        }
        
        /* Dirección de envío */
        .shipping-address {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }
        
        /* Estado */
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .status-pending {
          background-color: #ffe0b2;
          color: #e65100;
        }

        .status-processing {
          background-color: #e3f2fd;
          color: #0d47a1;
        }
        
        .status-completed {
          background-color: #c8e6c9;
          color: #2e7d32;
        }
        
        .status-canceled {
          background-color: #ffcdd2;
          color: #c62828;
        }
        
        .status-finalized {
          background-color: #bbdefb;
          color: #0d47a1;
        }
        
        /* Botones */
        .button-container {
          text-align: center;
          margin: 30px 0 20px;
        }
        
        .button {
          display: inline-block;
          background-color: #3498db;
          color: white;
          font-weight: bold;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        
        .button:hover {
          background-color: #2980b9;
        }
        
        /* Footer */
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        
        /* Responsive */
        @media only screen and (max-width: 480px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
          
          .content {
            padding: 20px 15px;
          }
          
          .order-info-label {
            width: 100%;
            margin-bottom: 5px;
          }
          
          .products-table {
            font-size: 14px;
          }
          
          .button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="header-text">¡Tu pedido está confirmado!</h1>
          <p class="subheader">Pedido #${_id.toString().substring(0, 8).toUpperCase()}</p>
        </div>
        
        <div class="content">
          <p class="greeting">Hola ${firstName} ${lastName},</p>
          
          <p>¡Gracias por tu compra en Hacienda Cantabria! Hemos recibido tu pedido y lo estamos procesando.</p>
          
          <div class="section">
            <h2 class="section-title">Detalles del pedido</h2>
            
            <div class="order-info">
              <div class="order-info-item">
                <div class="order-info-label">Número de pedido:</div>
                <div class="order-info-value">#${_id.toString().substring(0, 8).toUpperCase()}</div>
              </div>
              <div class="order-info-item">
                <div class="order-info-label">Fecha de compra:</div>
                <div class="order-info-value">${fechaOrden}</div>
              </div>
              <div class="order-info-item">
                <div class="order-info-label">Método de pago:</div>
                <div class="order-info-value">${payment.provider || 'No especificado'}</div>
              </div>
              <div class="order-info-item">
                <div class="order-info-label">Estado:</div>
                <div class="order-info-value">
                  <span class="status-badge status-${status}">${estadoOrden}</span>
                </div>
              </div>
              <div class="order-info-item">
                <div class="order-info-label">Entrega estimada:</div>
                <div class="order-info-value">${fechaEntrega}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Productos comprados</h2>
            
            <table class="products-table">
              <thead>
                <tr>
                  <th style="width: 80px;"></th>
                  <th>Producto</th>
                  <th style="text-align: center;">Cant.</th>
                  <th style="text-align: right;">Precio</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productosHTML}
              </tbody>
            </table>
            
            <div class="summary">
              <div class="summary-row">
                <div>Subtotal:</div>
                <div>$${subtotal.toFixed(2)}</div>
              </div>
              <div class="summary-row">
                <div>Envío:</div>
                <div>$${shippingCost.toFixed(2)}</div>
              </div>
              <div class="summary-row">
                <div>Comisión de pago:</div>
                <div>$${paymentCommission.toFixed(2)}</div>
              </div>
              <div class="summary-row total">
                <div>Total:</div>
                <div>$${total.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Dirección de entrega</h2>
            
            <div class="shipping-address">
              <div><strong>${shippingAddress.recipientName}</strong></div>
              <div>${shippingAddress.street}</div>
              <div>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}</div>
              <div>${shippingAddress.country}</div>
              ${shippingAddress.phoneContact ? `<div>Teléfono: ${shippingAddress.phoneContact}</div>` : ''}
              ${shippingAddress.additionalInstructions ? `<div><strong>Instrucciones adicionales:</strong> ${shippingAddress.additionalInstructions}</div>` : ''}
            </div>
          </div>
          
          <div class="button-container">
            <a class="button" href="${orderUrl}">Ver detalles del pedido</a>
          </div>
          
          <p>Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos respondiendo a este email o a través de nuestro formulario de contacto.</p>
        </div>
        
        <div class="footer">
          <p>Gracias por comprar en Hacienda Cantabria</p>
          <p>© ${new Date().getFullYear()} Hacienda Cantabria. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Envía un email de confirmación de compra al usuario
 * @param {string|object} orderIdOrReq - ID de la orden o objeto Request de Express
 * @param {object} [res] - Objeto Response de Express (opcional)
 * @returns {Promise<Object>} - Resultado del envío del email
 */
const enviarEmailConfirmacionOrden = async (orderIdOrReq, res = null) => {
  try {
    // Determinar si es una llamada HTTP o una llamada directa
    const orderId = typeof orderIdOrReq === 'string' ? orderIdOrReq : orderIdOrReq.params.orderId;

    if (!orderId) {
      const error = new Error('ID de orden no proporcionado');
      if (res) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      throw error;
    }

    // Importar los modelos necesarios
    const { Order } = await import('../models/Order.js');
    const { OrderDetail } = await import('../models/OrderDetail.js');
    const { User } = await import('../models/User.js');

    // Obtener la orden
    const order = await Order.findById(orderId)
      .populate('shipping.carrier');

    if (!order) {
      const error = new Error(`Orden con ID ${orderId} no encontrada`);
      if (res) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      throw error;
    }

    // Obtener los detalles de la orden (productos)
    const orderDetails = await OrderDetail.find({ orderId });

    // Obtener la información del usuario
    const usuario = await User.findById(order.userId);
    if (!usuario) {
      const error = new Error(`Usuario con ID ${order.userId} no encontrado`);
      if (res) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      throw error;
    }

    // Si es una solicitud HTTP, verificar que el usuario tenga permiso
    if (res && orderIdOrReq.user && orderIdOrReq.user._id.toString() !== usuario._id.toString() && !orderIdOrReq.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para acceder a esta orden'
      });
    }

    // Configurar el transportador de email
    const transporter = createTransporter();

    // Generar el contenido del email
    const htmlContent = await generarEmailConfirmacionOrdenHTML({
      order,
      orderDetails,
      usuario
    });

    // Configurar opciones del email
    const mailOptions = {
      from: `"Hacienda Cantabria" <${process.env.EMAIL_FROM}>`,
      to: usuario.email,
      subject: `Confirmación de tu pedido #${order._id.toString().substring(0, 8).toUpperCase()}`,
      html: htmlContent
    };

    // Enviar el email
    const info = await transporter.sendMail(mailOptions);

    const result = {
      success: true,
      messageId: info.messageId,
      orderId,
      email: usuario.email
    };

    // Si es una solicitud HTTP, enviar respuesta
    if (res) {
      return res.status(200).json({
        ...result,
        msg: 'Email de confirmación enviado exitosamente'
      });
    }

    return result;
  } catch (error) {
    console.error('Error en enviarEmailConfirmacionOrden:', error);

    // Si es una solicitud HTTP, enviar respuesta de error
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return {
      success: false,
      error: error.message,
      orderId: typeof orderIdOrReq === 'string' ? orderIdOrReq : orderIdOrReq.params?.orderId
    };
  }
};


/**
 * Envía un email de confirmación de compra al usuario
 * @param {string|object} orderIdOrReq - ID de la orden o objeto Request de Express
 * @param {object} [res] - Objeto Response de Express (opcional)
 * @returns {Promise<Object>} - Resultado del envío del email
 */
const enviarEmailConfirmacionOrdenDirecta = async (orderId, res = null) => {
  try {
    if (!orderId) {
      const error = new Error('ID de orden no proporcionado');
      if (res) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      throw error;
    }

    // Importar los modelos necesarios
    const { Order } = await import('../models/Order.js');
    const { OrderDetail } = await import('../models/OrderDetail.js');
    const { User } = await import('../models/User.js');

    // Obtener la orden
    const order = await Order.findById(orderId)
      .populate('shipping.carrier');

    if (!order) {
      const error = new Error(`Orden con ID ${orderId} no encontrada`);
      if (res) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      throw error;
    }

    // Obtener los detalles de la orden (productos)
    const orderDetails = await OrderDetail.find({ orderId });

    // Obtener la información del usuario
    const usuario = await User.findById(order.userId);
    if (!usuario) {
      const error = new Error(`Usuario con ID ${order.userId} no encontrado`);
      if (res) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      throw error;
    }

    // Configurar el transportador de email
    const transporter = createTransporter();

    // Generar el contenido del email
    const htmlContent = await generarEmailConfirmacionOrdenHTML({
      order,
      orderDetails,
      usuario
    });

    // Configurar opciones del email
    const mailOptions = {
      from: `"Hacienda Cantabria" <${process.env.EMAIL_FROM}>`,
      to: usuario.email,
      subject: `Confirmación de tu pedido #${order._id.toString().substring(0, 8).toUpperCase()}`,
      html: htmlContent
    };

    // Enviar el email
    const info = await transporter.sendMail(mailOptions);

    const result = {
      success: true,
      messageId: info.messageId,
      orderId,
      email: usuario.email
    };

    // Si es una solicitud HTTP, enviar respuesta
    if (res) {
      return res.status(200).json({
        ...result,
        msg: 'Email de confirmación enviado exitosamente'
      });
    }

    return result;
  } catch (error) {
    console.error('Error en enviarEmailConfirmacionOrden:', error);

    // Si es una solicitud HTTP, enviar respuesta de error
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    return {
      success: false,
      error: error.message,
      orderId
    };
  }
};

/**
 * Envía un email con un archivo PDF adjunto (boleta o factura)
 * @param {Object} datos - Datos necesarios para el envío
 * @param {string} datos.email - Correo electrónico del destinatario
 * @param {string} datos.firstName - Nombre del destinatario
 * @param {string} datos.lastName - Apellido del destinatario (opcional)
 * @param {Buffer|string} datos.pdfBuffer - Buffer del PDF o ruta al archivo temporal
 * @param {string} datos.documentType - Tipo de documento (boleta/factura)
 * @param {string} datos.documentNumber - Número de documento (opcional)
 * @returns {Promise<Object>} - Resultado del envío del email
 */
const enviarEmailConPDF = async (datos) => {
  try {
    const { email, firstName, lastName = '', pdfBuffer, documentType, documentNumber = '' } = datos;
    
    if (!email || !pdfBuffer) {
      throw new Error('Email del destinatario y archivo PDF son requeridos');
    }

    const transporter = createTransporter();
    
    // Determinar el tipo de documento para el asunto y contenido
    const tipoDocumento = documentType.toLowerCase() === 'factura' ? 'factura' : 'boleta';
    const documentoMayuscula = tipoDocumento.charAt(0).toUpperCase() + tipoDocumento.slice(1);
    
    // Configurar número de documento para mostrar si está disponible
    const numeroDocumento = documentNumber ? ` #${documentNumber}` : '';
    
    // Generar el contenido HTML del email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentoMayuscula}${numeroDocumento} - Hacienda Cantabria</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
            color: #333;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #2C3E50;
            padding: 30px 20px;
            text-align: center;
          }
          .header-text {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 30px 20px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #999;
          }
          @media only screen and (max-width: 480px) {
            .container {
              width: 100%;
              border-radius: 0;
            }
            .content {
              padding: 20px 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="header-text">Tu ${documentoMayuscula}${numeroDocumento}</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hola ${firstName} ${lastName},</p>
            <p>
              Tu ${tipoDocumento}${numeroDocumento} ha sido generada exitosamente. 
              Puedes encontrarla adjunta en este correo.
            </p>
            <p>
              Cualquier consulta, no dudes en contactarnos respondiendo a este correo
              o a través de nuestros canales de atención al cliente.
            </p>
            <p>
              Gracias por confiar en Hacienda Cantabria.
            </p>
          </div>
          
          <div class="footer">
            <p>Hacienda Cantabria - ${new Date().getFullYear()}</p>
            <p>Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Configurar opciones del email
    const mailOptions = {
      from: `"Hacienda Cantabria" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `Tu ${documentoMayuscula}${numeroDocumento} de Hacienda Cantabria`,
      html: htmlContent,
      attachments: [{
        filename: `${documentoMayuscula}${numeroDocumento}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    // Enviar el email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email con ${tipoDocumento} enviado a ${email}:`, {
      messageId: info.messageId,
      response: info.response
    });

    return {
      success: true,
      messageId: info.messageId,
      email
    };
  } catch (error) {
    console.error('Error al enviar email con PDF adjunto:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Exportar las funciones de email
export {
  enviarEmailConfirmacion,
  enviarEmailRecuperacion,
  generarEmailProductoFavoritoHTML,
  enviarEmailProductoFavorito,
  enviarEmailConfirmacionOrden,
  enviarEmailConfirmacionOrdenDirecta,
  enviarEmailConPDF
};