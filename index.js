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
// Rutas que requieren protección CSRF (operaciones sensibles de escritura)
app.use('/api/user', csrfProtection, userRoutes);
app.use('/api/cart', csrfProtection, cartRoutes);
app.use('/api/wishlist', csrfProtection, wishlistRoutes);
app.use('/api/order', csrfProtection, orderRoutes);
app.use('/api/payments', csrfProtection, paymentProcessingRoutes);
app.use('/api/quotations', csrfProtection, quotationRoutes);

// Rutas con menor sensibilidad o principalmente de lectura
app.use('/api/product', productRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/payment-methods', csrfProtection, paymentMethodRoutes);
app.use('/api/shipping-methods', csrfProtection, shippingMethodRoutes);
app.use('/api/util', csrfProtection, utilRoutes);
app.use('/api/regions', csrfProtection, regionRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});