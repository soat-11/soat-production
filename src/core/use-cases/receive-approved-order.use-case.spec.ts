import { ReceiveApprovedOrderUseCase } from "@core/use-cases/receive-approved-order.use-case";
import { IProductionRepository } from "@domain/repositories/i-production.repository";
import { ProductionStatus } from "@domain/enum/production-status.enum";
import { ProductionOrder } from "@domain/entities/production-order.entity";
import { Logger } from "@nestjs/common";

describe("ReceiveApprovedOrderUseCase", () => {
  let useCase: ReceiveApprovedOrderUseCase;
  let repository: IProductionRepository;

  const mockRepository = {
    findBySessionId: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});

    useCase = new ReceiveApprovedOrderUseCase(
      mockRepository as unknown as IProductionRepository
    );
    repository = mockRepository as unknown as IProductionRepository;
  });

  it("deve criar e salvar um novo pedido com sucesso", async () => {
    const sessionId = "session-new-123";
    const items = [{ sku: "BURGER", quantity: 1 }];

    mockRepository.findBySessionId.mockResolvedValue(null);
    mockRepository.save.mockResolvedValue(undefined);

    const result = await useCase.execute(sessionId, items);

    expect(result.isSuccess).toBe(true);
    expect(repository.findBySessionId).toHaveBeenCalledWith(sessionId);
    expect(repository.save).toHaveBeenCalledTimes(1);

    const savedOrder = mockRepository.save.mock.calls[0][0] as ProductionOrder;
    expect(savedOrder.sessionId).toBe(sessionId);
    expect(savedOrder.status).toBe(ProductionStatus.RECEIVED);
  });

  it("deve retornar sucesso mas NÃO salvar se o pedido já existir (Idempotência)", async () => {
    const sessionId = "session-existing-123";
    mockRepository.findBySessionId.mockResolvedValue(
      new ProductionOrder(sessionId, [], ProductionStatus.RECEIVED)
    );

    const result = await useCase.execute(sessionId, []);

    expect(result.isSuccess).toBe(true);
    expect(repository.findBySessionId).toHaveBeenCalledWith(sessionId);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("deve retornar falha se o repositório der erro ao salvar", async () => {
    mockRepository.findBySessionId.mockResolvedValue(null);
    mockRepository.save.mockRejectedValue(new Error("Erro de conexão"));

    const result = await useCase.execute("session-error", []);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(
      "Não foi possível registrar o pedido na produção."
    );
  });
});
