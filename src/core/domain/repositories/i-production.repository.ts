import { ProductionOrder } from "@domain/entities/production-order.entity";

export interface IProductionRepository {
  save(order: ProductionOrder): Promise<void>;
  findBySessionId(sessionId: string): Promise<ProductionOrder | null>;
  findAllActive(): Promise<ProductionOrder[]>;
}
