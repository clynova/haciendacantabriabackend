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
  const confirmationUrl = `${process.env.FRONTEND_URL}auth/verification-pending?email=${email}&token=${token}`;

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
  const resetUrl = `${process.env.FRONTEND_URL}/restablecer/${token}`;

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
  const { nombre, descripcion, precios, multimedia, slug } = producto;
  
  // Obtener la imagen principal del producto o la primera disponible
  const imagen = multimedia?.imagenes?.find(img => img.esPrincipal)?.url || 
                 multimedia?.imagenes?.[0]?.url || 
                 'https://via.placeholder.com/400x300?text=Producto';
  
  // Calcular el precio con descuentos
  const precioBase = precios?.base || 0;
  const descuento = precios?.descuentos?.regular || 0;
  const precioFinal = precioBase * (1 - (descuento / 100));
  
  // Crear URL del producto
  const productoUrl = `${process.env.FRONTEND_URL}product/${slug}`;
  
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

// Exportar las funciones de email
export {
  enviarEmailConfirmacion,
  enviarEmailRecuperacion,
  generarEmailProductoFavoritoHTML,
  enviarEmailProductoFavorito
};