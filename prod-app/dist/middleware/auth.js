"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Extender la interfaz Request para incluir el usuario
// Los tipos están definidos en types/express.d.ts
// Middleware para autenticar el token JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({ error: 'Token de acceso requerido' });
        }
        // Verificar el token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'supersecreto123');
        // Obtener el usuario de la base de datos
        const user = await prisma.usuario.findUnique({
            where: { id: decoded.id }
        });
        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }
        // Agregar el usuario a la request
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expirado' });
        }
        console.error('Error en autenticación:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};
exports.authenticateToken = authenticateToken;
