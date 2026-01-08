import { loadFeature, defineFeature } from "jest-cucumber";
import { Test, TestingModule } from "@nestjs/testing";
import { CartGateway, CartOutput } from "@infra/gayteways/cart.gateway";

class GetCartUseCase {
  constructor(private readonly cartGateway: CartGateway) {}
  async execute(sessionId: string) {
    return this.cartGateway.getCartBySessionId(sessionId);
  }
}

const feature = loadFeature("./test/bdd/features/cart.feature");

defineFeature(feature, (test) => {
  let useCase: GetCartUseCase;
  let cartGateway: CartGateway;
  let response: CartOutput | null;
  let error: any;

  // Mock do Gateway
  const mockCartGateway = {
    getCartBySessionId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CartGateway,
          useValue: mockCartGateway,
        },
      ],
    }).compile();

    cartGateway = module.get<CartGateway>(CartGateway);
    useCase = new GetCartUseCase(cartGateway);
  });

  // Cenario 1: Sucesso
  test("Recuperar um carrinho existente com sucesso", ({
    given,
    and,
    when,
    then,
  }) => {
    const sessionId = "session-123";

    given(/^que existe um carrinho associado à sessão "(.*)"$/, (session) => {
      // O mock deve coincidir com o "Given"
      expect(session).toBe(sessionId);
    });

    and(/^o carrinho contém o item "(.*)" com preço (.*)$/, (sku, price) => {
      mockCartGateway.getCartBySessionId.mockResolvedValue({
        sessionId: sessionId,
        items: [{ sku, quantity: 1, unitPrice: parseFloat(price) }],
        totalItems: 1,
        totalValue: parseFloat(price),
      });
    });

    when(
      /^eu solicito a consulta do carrinho para a sessão "(.*)"$/,
      async (session) => {
        response = await useCase.execute(session);
      }
    );

    then("devo receber os dados do carrinho", () => {
      expect(response).toBeDefined();
      expect(response?.sessionId).toBe(sessionId);
    });

    and(/^o valor total deve ser (.*)$/, (total) => {
      expect(response?.totalValue).toBe(parseFloat(total));
    });
  });

  // Cenario 2: Not Found (404 vindo do Gateway vira null no UseCase)
  test("Consultar um carrinho que não existe (Sessão Nova)", ({
    given,
    when,
    then,
  }) => {
    given(
      /^que não existe nenhum carrinho para a sessão "(.*)"$/,
      (session) => {
        mockCartGateway.getCartBySessionId.mockResolvedValue(null);
      }
    );

    when(
      /^eu solicito a consulta do carrinho para a sessão "(.*)"$/,
      async (session) => {
        response = await useCase.execute(session);
      }
    );

    then("devo receber um resultado vazio ou nulo", () => {
      expect(response).toBeNull();
    });
  });

  // Cenario 3: Erro (Exception)
  test("Falha ao consultar o serviço de carrinho", ({ given, when, then }) => {
    given("que o serviço de carrinho está indisponível", () => {
      mockCartGateway.getCartBySessionId.mockRejectedValue(
        new Error("Service Unavailable")
      );
    });

    when(
      /^eu solicito a consulta do carrinho para a sessão "(.*)"$/,
      async (session) => {
        try {
          await useCase.execute(session);
        } catch (e) {
          error = e;
        }
      }
    );

    then("devo receber um erro informando falha de comunicação", () => {
      expect(error).toBeDefined();
      expect(error.message).toBe("Service Unavailable");
    });
  });
});
