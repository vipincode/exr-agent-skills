import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as productService from "../services/product.service";

export const list = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.listProducts(Number(req.query.page) || 1, Number(req.query.limit) || 20);
  res.status(200).json({ data: result, message: "OK" });
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.getProduct(req.params.id);
  res.status(200).json({ data: product, message: "OK" });
});
