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
  private readonly cartServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.cartServiceUrl = this.configService.get<string>("CART_SERVICE_URL");
  }

  async getCartBySessionId(sessionId: string): Promise<CartOutput | null> {
    try {
      if (!this.cartServiceUrl) {
        throw new Error("CART_SERVICE_URL não configurada no .env");
      }

      const url = `${this.cartServiceUrl}/v1/cart`;

      this.logger.log(
        `Consultando carrinho em: ${url} [Session: ${sessionId}]`
      );

      const response$ = this.httpService.get<CartApiResponse>(url, {
        headers: {
          "x-session-id": sessionId,
        },
      });

      const response = await lastValueFrom(response$);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn(
          `Carrinho não encontrado para sessão ${sessionId} (404)`
        );
        return null;
      }
      this.logger.error(
        `Erro de comunicação com Cart Service: ${error.message}`
      );
      throw error;
    }
  }
}
