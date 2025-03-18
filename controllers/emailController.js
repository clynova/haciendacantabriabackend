import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del transporter de nodemailer
const createTransporter = () => {
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
      rejectUnauthorized: false,
      // Usar versión mínima de TLS 1.2
      minVersion: 'TLSv1.2'
    }
  };

  console.log('*'.repeat(50), process.env.EMAIL_PASS, '*'.repeat(50))
  return nodemailer.createTransport(options);
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

// Función para enviar email de confirmación de cuenta
const enviarEmailConfirmacion = async (usuario) => {
  try {
    const { firstName, email, token } = usuario;

    const transporter = createTransporter();

    const emailHtml = generarEmailConfirmacionHTML({
      firstName,
      token,
      email
    });

    const info = await transporter.sendMail({
      from: `"Hacienda Cantabria" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Confirma tu cuenta en Hacienda Cantabria',
      html: emailHtml
    });

    console.log('Email de confirmación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email de confirmación:', error);
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

export {
  enviarEmailConfirmacion,
  enviarEmailRecuperacion
};