import { Test, TestingModule } from "@nestjs/testing";
import { CartGateway } from "./cart.gateway";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { of, throwError } from "rxjs";
import { Logger } from "@nestjs/common";

describe("CartGateway", () => {
  let gateway: CartGateway;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const serviceUrl = "http://cart-service";
  const sessionId = "session-123";

  const expectedMockCart = {
    sessionId,
    items: [
      { sku: "BATATA-MOCK-G", quantity: 1, unitPrice: 25.9 },
      { sku: "COCA-COLA-2L", quantity: 1, unitPrice: 12.0 },
    ],
    totalItems: 2,
    totalValue: 37.9,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockReturnValue(serviceUrl);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartGateway,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<CartGateway>(CartGateway);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
  });

  it("deve retornar os dados do carrinho com sucesso (Happy Path)", async () => {
    const mockCartOutput = {
      sessionId,
      items: [{ sku: "SKU1", quantity: 1, unitPrice: 10 }],
      totalItems: 1,
      totalValue: 10,
    };

    const mockApiResponse = {
      data: {
        message: "Success",
        data: mockCartOutput,
      },
    };

    mockHttpService.get.mockReturnValue(of(mockApiResponse));

    const result = await gateway.getCartBySessionId(sessionId);

    expect(result).toEqual(mockCartOutput);
    expect(httpService.get).toHaveBeenCalledWith(`${serviceUrl}/v1/cart`, {
      headers: { "x-session-id": sessionId },
    });
  });

  it("deve retornar null se a API retornar 404 (Not Found)", async () => {
    const error404 = {
      response: { status: 404 },
      message: "Not Found",
    };
    mockHttpService.get.mockReturnValue(throwError(() => error404));

    const result = await gateway.getCartBySessionId(sessionId);

    expect(result).toBeNull();
  });

  it("deve retornar o MOCK (Fallback) se a API falhar com erro diferente de 404", async () => {
    const error500 = {
      response: { status: 500 },
      message: "Internal Server Error",
    };
    mockHttpService.get.mockReturnValue(throwError(() => error500));

    const result = await gateway.getCartBySessionId(sessionId);

    expect(result).toEqual(expectedMockCart);
  });

  it("deve retornar o MOCK (Fallback) se CART_SERVICE_URL não estiver definida", async () => {
    mockConfigService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartGateway,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    const newGateway = module.get<CartGateway>(CartGateway);

    const result = await newGateway.getCartBySessionId(sessionId);

    expect(result).toEqual(expectedMockCart);
  });
});
