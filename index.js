import 'dotenv/config';
import app from './src/app.js';
import { conectarDB } from './config/db.js';

// Conectar a la base de datos
conectarDB();

// Importar rutas
import { userRoutes } from './routes/userRoutes.js';
import { productRoutes } from './routes/productRoutes.js';
import { cartRoutes } from './routes/cartRoutes.js';
import { wishlistRoutes } from './routes/wishlistRoutes.js';
import { tagRoutes } from './routes/tagRoutes.js';
import { paymentMethodRoutes } from './routes/paymentMethodRoutes.js';
import { shippingMethodRoutes } from './routes/shippingMethodRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { paymentProcessingRoutes } from './routes/paymentProcessingRoutes.js';
import { utilRoutes } from './routes/utilRoutes.js';
import { quotationRoutes } from './routes/quotationRoutes.js';
import { regionRoutes } from './routes/regionRoutes.js';

// Importar la protección CSRF desde app.js
import { csrfProtection } from './src/app.js';

// Configurar rutas
// NOTA: Se ha desactivado temporalmente la protección CSRF para permitir que la aplicación funcione
// TODO: Reactivar la protección CSRF una vez que se solucionen los problemas de integración

// Rutas de autenticación y registro de usuarios
app.use('/api/user', csrfProtection, userRoutes); // Sin CSRF para evitar problemas de login

// Otras rutas que requieren protección CSRF
app.use('/api/cart', csrfProtection, cartRoutes);
app.use('/api/wishlist', csrfProtection, wishlistRoutes);
app.use('/api/order', csrfProtection, orderRoutes);
app.use('/api/payments', csrfProtection, paymentProcessingRoutes);
app.use('/api/quotations', csrfProtection, quotationRoutes);

// Rutas con menor sensibilidad o principalmente de lectura
app.use('/api/product', csrfProtection, productRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/shipping-methods', shippingMethodRoutes);
app.use('/api/util', utilRoutes);
app.use('/api/regions', regionRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});