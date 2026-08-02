import { Schema, model, Types } from "mongoose";
export interface ProductDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  price: number;          // in cents
  currency: string;       // ISO 4217, default "USD"
  category: string;
  inStock: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
const productSchema = new Schema<ProductDoc>(
  {
    name:     { type: String, required: true },
    slug:     { type: String, required: true, unique: true, index: true },
    price:    { type: Number, required: true },
    currency: { type: String, default: "USD" },
    category: { type: String, required: true, index: true },
    inStock:  { type: Boolean, default: true },
    imageUrl: { type: String },
  },
  { timestamps: true }
);
export const Product = model<ProductDoc>("Product", productSchema);
