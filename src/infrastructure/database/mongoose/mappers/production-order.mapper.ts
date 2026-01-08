import { ProductionOrder } from "@domain/entities/production-order.entity";
import { ProductionOrderModel } from "@infra/database/mongoose/schemas/production-order.schema";
import { ProductionStatus } from "@domain/enum/production-status.enum";

export class ProductionOrderMapper {
  static toDomain(
    raw: ProductionOrderModel & { _id: any; createdAt?: Date; updatedAt?: Date }
  ): ProductionOrder {
    return new ProductionOrder(
      raw.sessionId,
      raw.items,
      raw.status as ProductionStatus,
      raw._id.toString(),
      raw.createdAt,
      raw.updatedAt
    );
  }

  static toPersistence(domain: ProductionOrder): any {
    return {
      sessionId: domain.sessionId,
      status: domain.status,
      items: domain.items,
    };
  }
}
