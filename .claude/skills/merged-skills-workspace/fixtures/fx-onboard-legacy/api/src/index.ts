import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import productRoutes from "./routes/product.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ data: { ok: true }, message: "OK" }));
app.use("/api/products", productRoutes);

app.use(errorHandler);

mongoose.connect(process.env.MONGO_URL).then(() => {
  app.listen(process.env.PORT || 4000, () => console.log("api up"));
});
