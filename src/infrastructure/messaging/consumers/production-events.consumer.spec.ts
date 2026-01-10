import { Test, TestingModule } from "@nestjs/testing";
import { ProductionEventsConsumer } from "./production-events.consumer";
import { ConfigService } from "@nestjs/config";
import { ReceiveApprovedOrderUseCase } from "@core/use-cases/receive-approved-order.use-case";
import { CartGateway } from "@infra/gayteways/cart.gateway";
import { Consumer } from "sqs-consumer";
import { Logger } from "@nestjs/common";

jest.mock("sqs-consumer", () => ({
  Consumer: {
    create: jest.fn(),
  },
}));

describe("ProductionEventsConsumer", () => {
  let consumerService: ProductionEventsConsumer;
  let configService: ConfigService;
  let useCase: ReceiveApprovedOrderUseCase;
  let cartGateway: CartGateway;
  let mockConsumerInstance: any;

  beforeEach(async () => {
    mockConsumerInstance = {
      start: jest.fn(),
      stop: jest.fn(),
      on: jest.fn(),
    };

    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "debug").mockImplementation(() => {});

    (Consumer.create as jest.Mock).mockReturnValue(mockConsumerInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionEventsConsumer,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === "SQS_PAYMENT_CONFIRMED_URL") return "http://sqs-url";
              if (key === "AWS_REGION") return "us-east-1";
              return "test-value";
            }),
          },
        },
        {
          provide: ReceiveApprovedOrderUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CartGateway,
          useValue: {
            getCartBySessionId: jest.fn(),
          },
        },
      ],
    }).compile();

    consumerService = module.get<ProductionEventsConsumer>(
      ProductionEventsConsumer
    );
    configService = module.get<ConfigService>(ConfigService);
    useCase = module.get<ReceiveApprovedOrderUseCase>(
      ReceiveApprovedOrderUseCase
    );
    cartGateway = module.get<CartGateway>(CartGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve iniciar o consumidor corretamente no onModuleInit", () => {
    consumerService.onModuleInit();

    expect(Consumer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        queueUrl: "http://sqs-url",
      })
    );
    expect(mockConsumerInstance.on).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
    );
    expect(mockConsumerInstance.on).toHaveBeenCalledWith(
      "processing_error",
      expect.any(Function)
    );
    expect(mockConsumerInstance.start).toHaveBeenCalled();
  });

  it("deve parar o consumidor no onModuleDestroy", () => {
    consumerService.onModuleInit();
    consumerService.onModuleDestroy();

    expect(mockConsumerInstance.stop).toHaveBeenCalled();
  });

  describe("handleMessage", () => {
    let handleMessage: (message: any) => Promise<void>;

    beforeEach(() => {
      consumerService.onModuleInit();
      const createCall = (Consumer.create as jest.Mock).mock.calls[0][0];
      handleMessage = createCall.handleMessage;
    });

    it("deve processar mensagem com sucesso", async () => {
      const message = {
        Body: JSON.stringify({
          sessionId: "session-123",
          idempotencyKey: "key-123",
        }),
      };

      const mockCart = {
        items: [{ sku: "sku-1", quantity: 1 }],
      };

      (cartGateway.getCartBySessionId as jest.Mock).mockResolvedValue(mockCart);
      (useCase.execute as jest.Mock).mockResolvedValue({ isFailure: false });

      await handleMessage(message);

      expect(cartGateway.getCartBySessionId).toHaveBeenCalledWith(
        "session-123"
      );
      expect(useCase.execute).toHaveBeenCalledWith("session-123", [
        { sku: "sku-1", quantity: 1 },
      ]);
    });

    it("deve processar mensagem vinda do SNS (Message Wrapper)", async () => {
      const innerMessage = JSON.stringify({ sessionId: "session-sns" });
      const message = {
        Body: JSON.stringify({
          Message: innerMessage,
        }),
      };

      (cartGateway.getCartBySessionId as jest.Mock).mockResolvedValue({
        items: [],
      });
      (useCase.execute as jest.Mock).mockResolvedValue({ isFailure: false });

      await handleMessage(message);

      expect(cartGateway.getCartBySessionId).toHaveBeenCalledWith(
        "session-sns"
      );
    });

    it("deve ignorar mensagem sem sessionId", async () => {
      const message = {
        Body: JSON.stringify({ idempotencyKey: "key-123" }),
      };

      await handleMessage(message);

      expect(cartGateway.getCartBySessionId).not.toHaveBeenCalled();
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("deve ignorar se carrinho não for encontrado", async () => {
      const message = {
        Body: JSON.stringify({ sessionId: "session-123" }),
      };

      (cartGateway.getCartBySessionId as jest.Mock).mockResolvedValue(null);

      await handleMessage(message);

      expect(cartGateway.getCartBySessionId).toHaveBeenCalled();
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it("deve logar erro se useCase falhar", async () => {
      const message = {
        Body: JSON.stringify({ sessionId: "session-123" }),
      };

      (cartGateway.getCartBySessionId as jest.Mock).mockResolvedValue({
        items: [],
      });

      (useCase.execute as jest.Mock).mockResolvedValue({
        isFailure: true,
        getValue: jest.fn().mockReturnValue("Erro de dominio simulado"),
      });

      await handleMessage(message);

      expect(useCase.execute).toHaveBeenCalled();
    });

    it("deve relançar erro em caso de exceção", async () => {
      const message = {
        Body: JSON.stringify({ sessionId: "session-123" }),
      };

      (cartGateway.getCartBySessionId as jest.Mock).mockRejectedValue(
        new Error("Erro Fatal")
      );

      await expect(handleMessage(message)).rejects.toThrow("Erro Fatal");
    });
  });
});
