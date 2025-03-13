import 'dotenv/config';
import app from './src/app.js';
import { conectarDB } from './config/db.js';

// Conectar a la base de datos
conectarDB();

// Importar rutas
import { userRoutes } from './routes/userRoutes.js';
import { productRoutes } from './routes/productRoutes.js';
import { cartRoutes } from './routes/cartRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { reviewRoutes } from './routes/reviewRoutes.js';
import { wishlistRoutes } from './routes/wishlistRoutes.js';
import { paymentProcessingRoutes } from './routes/paymentProcessingRoutes.js';
import { shippingMethodRoutes } from './routes/shippingMethodRoutes.js';
import { paymentMethodRoutes } from './routes/paymentMethodRoutes.js';
import { tagRoutes } from './routes/tagRoutes.js';

// Configurar rutas
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentProcessingRoutes);
app.use('/api/shipping-methods', shippingMethodRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/tags', tagRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});