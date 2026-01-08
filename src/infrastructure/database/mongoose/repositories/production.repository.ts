import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { IProductionRepository } from "@domain/repositories/i-production.repository";
import { ProductionOrder } from "@domain/entities/production-order.entity";
import { ProductionStatus } from "@domain/enum/production-status.enum";
import { ProductionOrderModel } from "@infra/database/mongoose/schemas/production-order.schema";
import { ProductionOrderMapper } from "@infra/database/mongoose/mappers/production-order.mapper";

@Injectable()
export class ProductionRepository implements IProductionRepository {
  constructor(
    @InjectModel(ProductionOrderModel.name)
    private readonly productionModel: Model<ProductionOrderModel>
  ) {}

  async save(order: ProductionOrder): Promise<void> {
    const data = ProductionOrderMapper.toPersistence(order);

    await this.productionModel
      .findOneAndUpdate(
        { sessionId: order.sessionId },
        { $set: data },
        { upsert: true, new: true }
      )
      .exec();
  }

  async findBySessionId(sessionId: string): Promise<ProductionOrder | null> {
    const found = await this.productionModel.findOne({ sessionId }).exec();

    if (!found) return null;

    return ProductionOrderMapper.toDomain(found as any);
  }

  async findAllActive(): Promise<ProductionOrder[]> {
    const found = await this.productionModel
      .find({
        status: {
          $nin: [ProductionStatus.COMPLETED, ProductionStatus.CANCELLED],
        },
      })
      .sort({ createdAt: 1 })
      .exec();

    return found.map((item) => ProductionOrderMapper.toDomain(item as any));
  }
}
