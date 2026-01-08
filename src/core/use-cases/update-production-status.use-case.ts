import { Inject, Injectable } from "@nestjs/common";
import { IProductionRepository } from "@domain/repositories/i-production.repository";
import { IEventPublisher } from "@domain/events/i-event-publisher";
import { ProductionStatus } from "@domain/enum/production-status.enum";
import { Result } from "@shared/result";

@Injectable()
export class UpdateProductionStatusUseCase {
  constructor(
    @Inject("IProductionRepository")
    private readonly repository: IProductionRepository,
    @Inject("IEventPublisher")
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(
    sessionId: string,
    newStatus: ProductionStatus
  ): Promise<Result<void>> {
    try {
      const order = await this.repository.findBySessionId(sessionId);

      if (!order) {
        return Result.fail("Pedido não encontrado.");
      }

      if (newStatus === ProductionStatus.IN_PREPARATION) {
        order.startPreparation();
        await this.eventPublisher.publish("production.started", {
          sessionId,
          status: "IN_PREPARATION",
          timestamp: new Date(),
        });
      } else if (newStatus === ProductionStatus.READY) {
        order.markAsReady();
        await this.eventPublisher.publish("production.ready", {
          sessionId,
          status: "READY",
          timestamp: new Date(),
        });
      } else if (newStatus === ProductionStatus.COMPLETED) {
        order.markAsFinished();
        await this.eventPublisher.publish("production.withdrawn", {
          sessionId,
          status: "COMPLETED",
          timestamp: new Date(),
        });
      }

      await this.repository.save(order);
      return Result.ok();
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : "Erro desconhecido"
      );
    }
  }
}
