import { ListProductionOrdersUseCase } from "@core/use-cases/list-production-orders.use-case";
import { IProductionRepository } from "@domain/repositories/i-production.repository";
import { ProductionOrder } from "@domain/entities/production-order.entity";
import { ProductionStatus } from "@domain/enum/production-status.enum";

describe("ListProductionOrdersUseCase", () => {
  let useCase: ListProductionOrdersUseCase;
  let repository: IProductionRepository;

  const mockRepository = {
    findAllActive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    repository = mockRepository as unknown as IProductionRepository;
    useCase = new ListProductionOrdersUseCase(repository);
  });

  it("deve retornar uma lista de pedidos ativos com sucesso", async () => {
    const mockOrders = [
      new ProductionOrder("session-1", [], ProductionStatus.RECEIVED),
      new ProductionOrder("session-2", [], ProductionStatus.IN_PREPARATION),
    ];
    mockRepository.findAllActive.mockResolvedValue(mockOrders);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(2);
    expect(repository.findAllActive).toHaveBeenCalledTimes(1);
  });

  it("deve retornar failure quando o repositório lançar um erro", async () => {
    mockRepository.findAllActive.mockRejectedValue(new Error("Erro no banco"));
    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe("Erro ao listar pedidos da cozinha.");
  });
});
