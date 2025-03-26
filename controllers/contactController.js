import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Crear el transporter de nodemailer con las variables de entorno disponibles
const createTransporter = () => {
  // Opciones de configuración para el transporter
  const options = {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false, // Cambiar a true en producción con certificados válidos
      minVersion: 'TLSv1.2'
    }
  };

  try {
    return nodemailer.createTransport(options);
  } catch (error) {
    throw error;
  }
};

// Función para generar el HTML del email para el equipo
const generarEmailContactoEquipoHTML = ({ name, email, message }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nuevo mensaje de contacto</title>
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
          border-bottom: 1px solid #e0e0e0;
        }
        .header-text {
          font-size: 24px;
          font-weight: bold;
          color: #333333;
        }
        .content {
          padding: 20px;
        }
        .info-item {
          margin-bottom: 15px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
        }
        .message-box {
          margin-top: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
          border-left: 4px solid #4a6ee0;
        }
        .message-text {
          white-space: pre-line;
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-text">Nuevo mensaje de contacto</div>
        </div>
        
        <div class="content">
          <div class="info-item">
            <span class="info-label">Nombre:</span> ${name}
          </div>
          
          <div class="info-item">
            <span class="info-label">Email:</span> ${email}
          </div>
          
          <div class="message-box">
            <div class="info-label">Mensaje:</div>
            <p class="message-text">${message}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Función para generar el HTML del email de confirmación para el usuario
const generarEmailConfirmacionContactoHTML = ({ name }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hemos recibido tu mensaje</title>
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
          line-height: 1.6;
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
        .company-name {
          font-weight: bold;
          color: #4a6ee0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-text">¡Gracias por contactarnos!</div>
        </div>
        
        <div class="content">
          <p class="text">Hola ${name},</p>
          <p class="text">Hemos recibido tu mensaje y queremos agradecerte por ponerte en contacto con nosotros.</p>
          <p class="text">Nuestro equipo revisará tu mensaje y te responderá lo antes posible.</p>
          <p class="text">Si tienes alguna consulta urgente, no dudes en llamarnos al teléfono que aparece en nuestra página web.</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          <p class="footer-text">Este es un mensaje automático, por favor no respondas a este correo.</p>
          <p class="footer-text">Atentamente,</p>
          <p class="footer-text company-name">Equipo de Hacienda Cantabria</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Función para manejar el formulario de contacto
export const handleContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validación básica
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del email es inválido'
      });
    }

    // Crear transporter
    const transporter = createTransporter();

    // Configuración del email
    const mailOptions = {
      from: `"Formulario de Contacto" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_CONTACT || 'contacto@haciendacantabria.cl',
      replyTo: email,
      subject: `Nuevo mensaje de contacto de ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">Nuevo mensaje de contacto</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #555;">Mensaje:</h3>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
            Este mensaje fue enviado desde el formulario de contacto de Hacienda Cantabria.
          </p>
        </div>
      `
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);

    // Enviar confirmación al usuario si se desea
    const confirmationMailOptions = {
      from: `"Hacienda Cantabria" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Hemos recibido tu mensaje - Hacienda Cantabria',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">¡Gracias por contactarnos!</h2>
          
          <div style="margin: 20px 0;">
            <p>Hola ${name},</p>
            <p>Hemos recibido tu mensaje y te agradecemos por ponerte en contacto con nosotros.</p>
            <p>Nuestro equipo revisará tu consulta y te responderemos lo antes posible.</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Nota:</strong> Este es un mensaje automático, por favor no respondas a este correo.</p>
          </div>
          
          <p style="text-align: center; margin-top: 30px;">
            <strong>Atentamente,</strong><br>
            Equipo de Hacienda Cantabria
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(confirmationMailOptions);

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Mensaje enviado correctamente'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al enviar el mensaje',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};