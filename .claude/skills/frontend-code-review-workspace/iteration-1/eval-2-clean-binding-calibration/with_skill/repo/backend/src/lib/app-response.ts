import type { Response } from "express";
export const ok = <T>(res: Response, data: T, message = "OK") =>
  res.status(200).json({ success: true, data, message });
export const created = <T>(res: Response, data: T, message = "Created") =>
  res.status(201).json({ success: true, data, message });
export const noContent = (res: Response) => res.status(204).send();
