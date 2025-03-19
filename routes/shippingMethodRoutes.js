import express from "express";
import {
    createShippingMethod,
    getShippingMethods,
    getShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
} from "../controllers/shippingMethodController.js";
import { validateCreateShippingMethod, validateUpdateShippingMethod } from "../middleware/validators/shippingMethodValidators.js";
import { checkAuth, checkRole } from "../middleware/authMiddleware.js";

const shippingMethodRoutes = express.Router();

// Rutas públicas
shippingMethodRoutes.get("/", getShippingMethods);
shippingMethodRoutes.get("/:_id", getShippingMethod);

// Rutas protegidas - solo administradores
shippingMethodRoutes.post("/", checkAuth, checkRole('admin'), validateCreateShippingMethod, createShippingMethod);
shippingMethodRoutes.put("/:_id", checkAuth, checkRole('admin'), validateUpdateShippingMethod, updateShippingMethod);
shippingMethodRoutes.delete("/:_id", checkAuth, checkRole('admin'), deleteShippingMethod);

export { shippingMethodRoutes };