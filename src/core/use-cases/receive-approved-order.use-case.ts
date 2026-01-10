import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  ProductionOrder,
  ProductionItem,
} from "@domain/entities/production-order.entity";
import { IProductionRepository } from "@domain/repositories/i-production.repository";
import { Result } from "@shared/result";

@Injectable()
export class ReceiveApprovedOrderUseCase {
  private readonly logger = new Logger(ReceiveApprovedOrderUseCase.name);

  constructor(
    @Inject("IProductionRepository")
    private readonly repository: IProductionRepository
  ) {}

  async execute(
    sessionId: string,
    items: ProductionItem[]
  ): Promise<Result<void>> {
    try {
      const alreadyExists = await this.repository.findBySessionId(sessionId);

      if (alreadyExists) {
        this.logger.warn(
          `Pedido ${sessionId} já existe na produção. Ignorando processamento.`
        );
        return Result.ok();
      }

      const newOrder = ProductionOrder.create(sessionId, items);

      await this.repository.save(newOrder);

      return Result.ok();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      this.logger.error(
        `Erro ao processar recebimento do pedido ${sessionId}: ${errorMessage}`
      );

      return Result.fail("Não foi possível registrar o pedido na produção.");
    }
  }
}
