// models/TokenBlacklist.js
import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now, expires: '1h' }, // El token se elimina automáticamente después de 1 hora
});

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

export { TokenBlacklist };