import express from "express";
import {
    createShippingMethod,
    getShippingMethods,
    getShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
} from "../controllers/shippingMethodController.js";
import { validateCreateShippingMethod, validateUpdateShippingMethod } from "../middleware/validators/shippingMethodValidators.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const shippingMethodRoutes = express.Router();

// Rutas públicas
shippingMethodRoutes.get("/", getShippingMethods);
shippingMethodRoutes.get("/:id", getShippingMethod);

// Rutas protegidas - solo administradores
shippingMethodRoutes.post("/", checkAuth, validateCreateShippingMethod, createShippingMethod);
shippingMethodRoutes.put("/:id", checkAuth, validateUpdateShippingMethod, updateShippingMethod);
shippingMethodRoutes.delete("/:id", checkAuth, deleteShippingMethod);

export { shippingMethodRoutes };