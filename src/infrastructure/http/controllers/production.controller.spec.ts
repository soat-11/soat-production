import { Test, TestingModule } from "@nestjs/testing";
import { ProductionController } from "./production.controller";
import { ListProductionOrdersUseCase } from "@core/use-cases/list-production-orders.use-case";
import { UpdateProductionStatusUseCase } from "@core/use-cases/update-production-status.use-case";
import { Response } from "express";
import { ProductionStatus } from "@domain/enum/production-status.enum";
import { Result } from "@shared/result";
import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";

describe("ProductionController", () => {
  let controller: ProductionController;
  let listUseCase: ListProductionOrdersUseCase;
  let updateUseCase: UpdateProductionStatusUseCase;
  let response: Partial<Response>;

  beforeEach(async () => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionController],
      providers: [
        {
          provide: ListProductionOrdersUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateProductionStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductionController>(ProductionController);
    listUseCase = module.get<ListProductionOrdersUseCase>(
      ListProductionOrdersUseCase
    );
    updateUseCase = module.get<UpdateProductionStatusUseCase>(
      UpdateProductionStatusUseCase
    );
  });

  describe("list", () => {
    it("deve retornar lista de pedidos com sucesso", async () => {
      const mockOrders = [{ sessionId: "123", status: "RECEIVED" }];
      (listUseCase.execute as jest.Mock).mockResolvedValue(
        Result.ok(mockOrders)
      );

      await controller.list(response as Response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(mockOrders);
    });

    it("deve lançar InternalServerErrorException em caso de falha", async () => {
      (listUseCase.execute as jest.Mock).mockResolvedValue(
        Result.fail("Erro interno")
      );

      await expect(controller.list(response as Response)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("updateStatus", () => {
    it("deve atualizar status com sucesso", async () => {
      (updateUseCase.execute as jest.Mock).mockResolvedValue(Result.ok());

      await controller.updateStatus(
        "123",
        { status: ProductionStatus.IN_PREPARATION },
        response as Response
      );

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        message: "Status atualizado com sucesso",
      });
    });

    it("deve lançar BadRequestException em caso de falha", async () => {
      (updateUseCase.execute as jest.Mock).mockResolvedValue(
        Result.fail("Erro de negócio")
      );

      await expect(
        controller.updateStatus(
          "123",
          { status: ProductionStatus.READY },
          response as Response
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
