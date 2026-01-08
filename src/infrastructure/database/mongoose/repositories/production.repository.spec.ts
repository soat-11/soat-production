import { Test, TestingModule } from "@nestjs/testing";
import { ProductionRepository } from "./production.repository";
import { getModelToken } from "@nestjs/mongoose";
import { ProductionOrderModel } from "../schemas/production-order.schema";
import { ProductionOrder } from "@domain/entities/production-order.entity";
import { ProductionStatus } from "@domain/enum/production-status.enum";

describe("ProductionRepository", () => {
  let repository: ProductionRepository;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      findOneAndUpdate: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionRepository,
        {
          provide: getModelToken(ProductionOrderModel.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<ProductionRepository>(ProductionRepository);
  });

  describe("save", () => {
    it("deve salvar ou atualizar um pedido", async () => {
      const order = new ProductionOrder(
        "session-1",
        [],
        ProductionStatus.RECEIVED
      );
      mockModel.exec.mockResolvedValue({});

      await repository.save(order);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { sessionId: "session-1" },
        {
          $set: {
            sessionId: "session-1",
            status: "RECEIVED",
            items: [],
          },
        },
        { upsert: true, new: true }
      );
    });
  });

  describe("findBySessionId", () => {
    it("deve retornar um ProductionOrder quando encontrado", async () => {
      const mockDoc = {
        sessionId: "session-1",
        items: [],
        status: "RECEIVED",
        _id: "mongo-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockModel.exec.mockResolvedValue(mockDoc);

      const result = await repository.findBySessionId("session-1");

      expect(mockModel.findOne).toHaveBeenCalledWith({
        sessionId: "session-1",
      });
      expect(result).toBeInstanceOf(ProductionOrder);
      expect(result?.sessionId).toBe("session-1");
    });

    it("deve retornar null quando não encontrado", async () => {
      mockModel.exec.mockResolvedValue(null);

      const result = await repository.findBySessionId("session-x");

      expect(result).toBeNull();
    });
  });

  describe("findAllActive", () => {
    it("deve retornar lista de pedidos ativos ordenados", async () => {
      const mockDocs = [
        {
          sessionId: "s1",
          items: [],
          status: "RECEIVED",
          _id: "id1",
        },
        {
          sessionId: "s2",
          items: [],
          status: "IN_PREPARATION",
          _id: "id2",
        },
      ];
      mockModel.exec.mockResolvedValue(mockDocs);

      const result = await repository.findAllActive();

      expect(mockModel.find).toHaveBeenCalledWith({
        status: {
          $nin: [ProductionStatus.COMPLETED, ProductionStatus.CANCELLED],
        },
      });
      expect(mockModel.sort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ProductionOrder);
    });
  });
});
