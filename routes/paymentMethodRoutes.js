import express from "express";
import {
    createPaymentMethod,
    getAllPaymentMethods,
    getPaymentMethodsById,
    updatePaymentMethod,
    deletePaymentMethod,
    restorePaymentMethod
} from "../controllers/paymentMethodController.js";
import { validateCreatePaymentMethod, validateUpdatePaymentMethod } from "../middleware/validators/paymentMethodValidators.js";
import { checkAuth, checkRole } from "../middleware/authMiddleware.js";

const paymentMethodRoutes = express.Router();

// Rutas públicas
paymentMethodRoutes.get("/", getAllPaymentMethods);
paymentMethodRoutes.get("/:_id", getPaymentMethodsById);

// Rutas protegidas - solo administradores
paymentMethodRoutes.get("/admin/all", checkAuth, checkRole('admin'), getAllPaymentMethods);
paymentMethodRoutes.post("/", checkAuth, checkRole('admin'), validateCreatePaymentMethod, createPaymentMethod);
paymentMethodRoutes.put("/:_id", checkAuth, checkRole('admin'), validateUpdatePaymentMethod, updatePaymentMethod);
paymentMethodRoutes.delete("/:_id", checkAuth, checkRole('admin'), deletePaymentMethod);
paymentMethodRoutes.put("/restore/:_id", checkAuth, checkRole('admin'), restorePaymentMethod);

export { paymentMethodRoutes }; 