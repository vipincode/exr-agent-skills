import express from "express";
import { productsRouter } from "./modules/products/products.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
const app = express();
app.use(express.json());
app.use("/api/products", productsRouter);   // <-- products mounted here
app.use("/api/auth", authRouter);           // <-- auth mounted here
export default app;
