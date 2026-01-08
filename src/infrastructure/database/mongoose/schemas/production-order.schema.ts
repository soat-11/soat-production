import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProductionOrderDocument = HydratedDocument<ProductionOrderModel>;

@Schema({ collection: "production_orders", timestamps: true })
export class ProductionOrderModel {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  status: string;

  @Prop({ type: Array, required: true })
  items: Array<{ sku: string; quantity: number }>;
}

export const ProductionOrderSchema =
  SchemaFactory.createForClass(ProductionOrderModel);
