import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
export interface CartItem {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface CartOutput {
  sessionId: string;
  items: CartItem[];
  totalItems: number;
  totalValue: number;
}

interface CartApiResponse {
  message: string;
  data: CartOutput;
}
@Injectable()
export class CartGateway {
  private readonly logger = new Logger(CartGateway.name);
  private readonly cartServiceUrl: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.cartServiceUrl = this.configService.get<string>("CART_SERVICE_URL");
  }

  async getCartBySessionId(sessionId: string): Promise<CartOutput | null> {
    if (!this.cartServiceUrl) {
      this.logger.warn(`ENV 'CART_SERVICE_URL' não definida. Usando Mock.`);
      return this.generateMockCart(sessionId);
    }

    try {
      const { data } = await lastValueFrom(
        this.httpService.get<CartApiResponse>(
          `${this.cartServiceUrl}/v1/cart`,
          {
            headers: { "x-session-id": sessionId },
          }
        )
      );

      return data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }

      this.logger.error(
        `Erro ao comunicar com CartService: ${error.message}. Usando Mock.`
      );
      return this.generateMockCart(sessionId);
    }
  }

  private generateMockCart(sessionId: string): CartOutput {
    return {
      sessionId,
      items: [
        { sku: "BATATA-MOCK-G", quantity: 1, unitPrice: 25.9 },
        { sku: "COCA-COLA-2L", quantity: 1, unitPrice: 12.0 },
      ],
      totalItems: 2,
      totalValue: 37.9,
    };
  }
}
