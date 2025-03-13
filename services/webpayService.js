/**
 * Servicio para integración con WebPay Plus de Transbank
 * Requiere instalar: npm install transbank-sdk
 */
import pkg from 'transbank-sdk';
const { WebpayPlus, Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = pkg;

// Función auxiliar para validar URL
const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch (_) {
        return false;
    }
};

/**
 * Inicializa una transacción en WebPay
 * @param {Number} amount - Monto a pagar
 * @param {String} buyOrder - Número de orden de compra
 * @param {String} returnUrl - URL de retorno después del pago
 * @param {String} sessionId - ID de sesión del usuario
 * @returns {Object} Respuesta de WebPay con URL de formulario y token
 */
export const initTransaction = async (amount, buyOrder, returnUrl, sessionId) => {
  try {
    // Validar los parámetros de entrada
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('El monto debe ser un número positivo');
    }
    
    if (!buyOrder || buyOrder.length > 26) {
      throw new Error(`'buyOrder' es inválido o demasiado largo (máximo 26 caracteres, actual: ${buyOrder ? buyOrder.length : 0})`);
    }
    
    if (!returnUrl || !isValidUrl(returnUrl)) {
      throw new Error(`La URL de retorno '${returnUrl}' no es válida. Debe ser una URL HTTP o HTTPS válida.`);
    }
    
    if (!sessionId) {
      throw new Error('El ID de sesión es requerido');
    }

    // Configuración según entorno
    let options;
    if (process.env.WEBPAY_ENVIRONMENT === 'production') {
      options = new Options(
        process.env.WEBPAY_COMMERCE_CODE,
        process.env.WEBPAY_API_KEY,
        Environment.Production
      );
    } else {
      // Usar credenciales de integración por defecto
      options = new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      );
    }

    // Crear instancia de WebpayPlus
    const tx = new WebpayPlus.Transaction(options);
    
    console.log('Iniciando transacción WebPay con:', {
      buyOrder,
      sessionId,
      amount,
      returnUrl,
      environment: process.env.WEBPAY_ENVIRONMENT || 'integration',
      commerceCode: options.commerceCode
    });
    
    // Iniciar transacción
    const response = await tx.create(buyOrder, sessionId, amount, returnUrl);
    console.log('Respuesta de WebPay:', response);
    return response;
  } catch (error) {
    console.error('Error detallado de WebPay:', error);
    if (error.message.includes('Invalid URL')) {
      throw new Error(`URL de retorno inválida: ${returnUrl}. Asegúrate de que la URL sea accesible y use el formato correcto.`);
    }
    throw error;
  }
};

/**
 * Confirma una transacción WebPay usando el token
 * @param {String} token - Token de la transacción
 * @returns {Object} Resultado de la transacción
 */
export const confirmTransaction = async (token) => {
  try {
    // Configuración según entorno
    let options;
    if (process.env.WEBPAY_ENVIRONMENT === 'production') {
      options = new Options(
        process.env.WEBPAY_COMMERCE_CODE,
        process.env.WEBPAY_API_KEY,
        Environment.Production
      );
    } else {
      // Usar credenciales de integración por defecto
      options = new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration
      );
    }

    // Crear instancia de WebpayPlus
    const tx = new WebpayPlus.Transaction(options);
    
    console.log('Confirmando transacción con token:', token);
    
    // Confirmar la transacción
    const response = await tx.commit(token);
    console.log('Respuesta de confirmación WebPay:', response);
    return response;
  } catch (error) {
    console.error('Error detallado confirmando transacción WebPay:', error);
    throw error;
  }
};

/**
 * Revierte una transacción en caso de error
 * @param {String} token - Token de la transacción
 * @returns {Object} Resultado de la reversión
 */
export const reverseTransaction = async (token) => {
  try {
    const tx = new WebpayPlus.Transaction(
      process.env.WEBPAY_COMMERCE_CODE,
      process.env.WEBPAY_API_KEY,
      process.env.WEBPAY_ENVIRONMENT
    );
    
    // Reversar la transacción
    const response = await tx.reverse(token);
    return response;
  } catch (error) {
    console.error('Error reversando transacción WebPay:', error);
    throw error;
  }
};

/**
 * Obtiene el estado de una transacción
 * @param {String} token - Token de la transacción
 * @returns {Object} Estado de la transacción
 */
export const getTransactionStatus = async (token) => {
  try {
    const tx = new WebpayPlus.Transaction(
      process.env.WEBPAY_COMMERCE_CODE,
      process.env.WEBPAY_API_KEY,
      process.env.WEBPAY_ENVIRONMENT
    );
    
    // Obtener estado de la transacción
    const response = await tx.status(token);
    return response;
  } catch (error) {
    console.error('Error obteniendo estado de transacción WebPay:', error);
    throw error;
  }
}; 