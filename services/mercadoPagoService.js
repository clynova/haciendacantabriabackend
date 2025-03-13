/**
 * Servicio para integración con MercadoPago
 * Requiere instalar: npm install mercadopago
 */
import mercadopago from 'mercadopago';

// Configuración de la API
const configureMercadoPago = () => {
  mercadopago.configure({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
    sandbox: process.env.MERCADOPAGO_SANDBOX === 'true'
  });
};

/**
 * Crea una preferencia de pago en MercadoPago
 * @param {Object} orderData - Datos de la orden
 * @param {Array} items - Elementos a pagar
 * @param {Object} payer - Información del pagador
 * @returns {Object} Preferencia de pago creada
 */
export const createPayment = async (orderData, items, payer) => {
  try {
    configureMercadoPago();
    
    // Crear preferencia de pago
    const preference = {
      items: items.map(item => ({
        title: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        currency_id: 'CLP' // Según tu moneda (configurable)
      })),
      back_urls: {
        success: process.env.FRONTEND_URL + "/checkout/success",
        failure: process.env.FRONTEND_URL + "/checkout/failure",
        pending: process.env.FRONTEND_URL + "/checkout/pending"
      },
      external_reference: orderData.id,
      payer: {
        name: payer.name,
        email: payer.email,
      },
      auto_return: "approved",
      notification_url: process.env.BACKEND_URL + "/api/payments/mercadopago/webhook"
    };
    
    const response = await mercadopago.preferences.create(preference);
    return response;
  } catch (error) {
    console.error('Error creando pago MercadoPago:', error);
    throw error;
  }
};

/**
 * Obtiene el estado de un pago
 * @param {String} paymentId - ID del pago
 * @returns {Object} Estado del pago
 */
export const getPaymentStatus = async (paymentId) => {
  try {
    configureMercadoPago();
    const response = await mercadopago.payment.get(paymentId);
    return response;
  } catch (error) {
    console.error('Error obteniendo estado de pago MercadoPago:', error);
    throw error;
  }
};

/**
 * Procesa la notificación IPN (Instant Payment Notification) de MercadoPago
 * @param {Object} webhookData - Datos recibidos del webhook
 * @returns {Object} Datos del pago procesado
 */
export const processWebhook = async (webhookData) => {
  try {
    configureMercadoPago();
    
    // Si es una notificación de pago
    if (webhookData.type === 'payment') {
      const paymentId = webhookData.data.id;
      const paymentInfo = await getPaymentStatus(paymentId);
      
      return {
        status: paymentInfo.response.status,
        external_reference: paymentInfo.response.external_reference,
        transaction_amount: paymentInfo.response.transaction_amount,
        payment_method_id: paymentInfo.response.payment_method_id,
        payment_type_id: paymentInfo.response.payment_type_id,
        paymentId
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error procesando webhook de MercadoPago:', error);
    throw error;
  }
};

/**
 * Reembolsa un pago
 * @param {String} paymentId - ID del pago a reembolsar
 * @returns {Object} Resultado del reembolso
 */
export const refundPayment = async (paymentId) => {
  try {
    configureMercadoPago();
    const response = await mercadopago.refund.create({ payment_id: paymentId });
    return response;
  } catch (error) {
    console.error('Error reembolsando pago MercadoPago:', error);
    throw error;
  }
}; 