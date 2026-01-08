import { UpdateProductionStatusUseCase } from "@core/use-cases/update-production-status.use-case";
import { IProductionRepository } from "@domain/repositories/i-production.repository";
import { IEventPublisher } from "@domain/events/i-event-publisher";
import { ProductionOrder } from "@domain/entities/production-order.entity";
import { ProductionStatus } from "@domain/enum/production-status.enum";

describe("UpdateProductionStatusUseCase", () => {
  let useCase: UpdateProductionStatusUseCase;
  let repository: IProductionRepository;
  let publisher: IEventPublisher;

  const mockRepository = {
    findBySessionId: jest.fn(),
    save: jest.fn(),
  };

  const mockPublisher = {
    publish: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = mockRepository as unknown as IProductionRepository;
    publisher = mockPublisher as unknown as IEventPublisher;
    useCase = new UpdateProductionStatusUseCase(repository, publisher);
  });

  it("deve retornar erro se o pedido não for encontrado", async () => {
    mockRepository.findBySessionId.mockResolvedValue(null);

    const result = await useCase.execute(
      "session-fake",
      ProductionStatus.IN_PREPARATION
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Pedido não encontrado.");
  });

  it("deve iniciar preparação e publicar evento production.started", async () => {
    const order = new ProductionOrder("sess-1", [], ProductionStatus.RECEIVED);
    mockRepository.findBySessionId.mockResolvedValue(order);

    const result = await useCase.execute(
      "sess-1",
      ProductionStatus.IN_PREPARATION
    );

    expect(result.isSuccess).toBe(true);
    expect(order.status).toBe(ProductionStatus.IN_PREPARATION);
    expect(repository.save).toHaveBeenCalledWith(order);
    expect(publisher.publish).toHaveBeenCalledWith(
      "production.started",
      expect.objectContaining({
        sessionId: "sess-1",
        status: "IN_PREPARATION",
      })
    );
  });

  it("deve marcar como pronto e publicar evento production.ready", async () => {
    const order = new ProductionOrder(
      "sess-1",
      [],
      ProductionStatus.IN_PREPARATION
    );
    mockRepository.findBySessionId.mockResolvedValue(order);

    const result = await useCase.execute("sess-1", ProductionStatus.READY);

    expect(result.isSuccess).toBe(true);
    expect(order.status).toBe(ProductionStatus.READY);
    expect(publisher.publish).toHaveBeenCalledWith(
      "production.ready",
      expect.objectContaining({
        status: "READY",
      })
    );
  });

  it("deve finalizar pedido e publicar evento production.withdrawn", async () => {
    const order = new ProductionOrder("sess-1", [], ProductionStatus.READY);
    mockRepository.findBySessionId.mockResolvedValue(order);

    const result = await useCase.execute("sess-1", ProductionStatus.COMPLETED);

    expect(result.isSuccess).toBe(true);
    expect(order.status).toBe(ProductionStatus.COMPLETED);
    expect(publisher.publish).toHaveBeenCalledWith(
      "production.withdrawn",
      expect.objectContaining({
        status: "COMPLETED",
      })
    );
  });

  it("deve retornar erro se tentar pular etapas (Regra de Negócio da Entidade)", async () => {
    const order = new ProductionOrder("sess-1", [], ProductionStatus.RECEIVED);
    mockRepository.findBySessionId.mockResolvedValue(order);

    const result = await useCase.execute("sess-1", ProductionStatus.READY);

    expect(result.isFailure).toBe(true);

    expect(result.error).toContain("precisa estar");
    expect(repository.save).not.toHaveBeenCalled();
    expect(publisher.publish).not.toHaveBeenCalled();
  });
});
