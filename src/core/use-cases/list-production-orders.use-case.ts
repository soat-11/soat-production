import { Inject, Injectable } from "@nestjs/common";
import { ProductionOrder } from "@domain/entities/production-order.entity";
import { IProductionRepository } from "@domain/repositories/i-production.repository";
import { Result } from "@shared/result";

@Injectable()
export class ListProductionOrdersUseCase {
  constructor(
    @Inject("IProductionRepository")
    private readonly repository: IProductionRepository
  ) {}

  async execute(): Promise<Result<ProductionOrder[]>> {
    try {
      const orders = await this.repository.findAllActive();
      return Result.ok(orders);
    } catch (error) {
      return Result.fail("Erro ao listar pedidos da cozinha.");
    }
  }
}
