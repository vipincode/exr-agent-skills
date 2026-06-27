import express from "express";
import { productsRouter } from "./modules/products/products.routes.js";
const app = express();
app.use(express.json());
app.use("/api/products", productsRouter);   // <-- products mounted here
export default app;
