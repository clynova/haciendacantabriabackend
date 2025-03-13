import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const conectarDB = async () => {
    const { DB_USER, DB_PASSWORD, DB_NAME } = process.env; // Asegúrate de incluir DB_NAME en tu archivo .env

    if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
        console.error("Error: Faltan variables de entorno para la conexión a MongoDB");
        process.exit(1);
    }

    try {
        //const uri = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@botdiscord.hj39v.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;
        const uri =  `mongodb+srv://${DB_USER}:${DB_PASSWORD}@haciendacantabria.t1eoa.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`
        const db = await mongoose.connect(uri);

        console.log(`Mongo conectado en ${db.connection.host}`);
    } catch (err) {
        console.error(`Error al conectar con MongoDB: ${err.message}`);
        process.exit(1); // Salida con error
    }
};

export { conectarDB };
