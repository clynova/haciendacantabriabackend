import jwt from 'jsonwebtoken';

const generarJWT = (_id, email) => {
    const token = jwt.sign(
        { _id, email }, // Payload
        process.env.JWT_SECRET, // Clave secreta (debe estar en las variables de entorno)
        { expiresIn: '30d' } // Tiempo de expiración del token
    );
    return token
}

export { generarJWT }