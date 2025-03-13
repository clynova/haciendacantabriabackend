import express from "express";
import {
    createPaymentMethod,
    getPaymentMethods,
    getAllPaymentMethods,
    getPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    restorePaymentMethod
} from "../controllers/paymentMethodController.js";
import { validateCreatePaymentMethod, validateUpdatePaymentMethod } from "../middleware/validators/paymentMethodValidators.js";
import { checkAuth, checkRole } from "../middleware/authMiddleware.js";

const paymentMethodRoutes = express.Router();

// Rutas públicas
paymentMethodRoutes.get("/", getPaymentMethods);
paymentMethodRoutes.get("/:id", getPaymentMethod);

// Rutas protegidas - solo administradores
paymentMethodRoutes.get("/admin/all", checkAuth, checkRole('admin'), getAllPaymentMethods);
paymentMethodRoutes.post("/", checkAuth, checkRole('admin'), validateCreatePaymentMethod, createPaymentMethod);
paymentMethodRoutes.put("/:id", checkAuth, checkRole('admin'), validateUpdatePaymentMethod, updatePaymentMethod);
paymentMethodRoutes.delete("/:id", checkAuth, checkRole('admin'), deletePaymentMethod);
paymentMethodRoutes.put("/restore/:id", checkAuth, checkRole('admin'), restorePaymentMethod);

export { paymentMethodRoutes }; 