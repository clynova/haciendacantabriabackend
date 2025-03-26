import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Crear el transporter de nodemailer con las variables de entorno disponibles
const createTransporter = () => {
  try {
    // Opciones de configuración para el transporter
    const options = {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === '465', // Autodetect secure based on port
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Cambiar a true en producción con certificados válidos
      }
    };

    return nodemailer.createTransport(options);
  } catch (error) {
    console.error("Error creating transporter:", error);
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
    
    try {
      // Configuración del email
      const mailOptions = {
        from: `"Formulario de Contacto" <${process.env.EMAIL_FROM}>`,
        to: process.env.EMAIL_CONTACT || 'contacto@haciendacantabria.cl',
        replyTo: email,
        subject: `Nuevo mensaje de contacto de ${name}`,
        html: generarEmailContactoEquipoHTML({ name, email, message })
      };

      // Enviar el email
      const info = await transporter.sendMail(mailOptions);

      // Respuesta exitosa sin enviar confirmación al usuario para simplificar
      return res.status(200).json({
        success: true,
        message: 'Mensaje enviado correctamente'
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
  } catch (error) {
    console.error("General error in contact form:", error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el formulario de contacto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};