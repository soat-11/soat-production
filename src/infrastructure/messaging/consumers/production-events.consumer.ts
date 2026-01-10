import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { Consumer } from "sqs-consumer";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ConfigService } from "@nestjs/config";
import { ReceiveApprovedOrderUseCase } from "@core/use-cases/receive-approved-order.use-case";
import { CartGateway } from "@infra/gayteways/cart.gateway";

interface PaymentConfirmedMessage {
  sessionId: string;
  idempotencyKey: string;
}

@Injectable()
export class ProductionEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  private readonly logger = new Logger(ProductionEventsConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly receiveApprovedOrderUseCase: ReceiveApprovedOrderUseCase,
    private readonly cartGateway: CartGateway
  ) {}

  onModuleInit() {
    const queueUrl = this.configService.get<string>(
      "SQS_PAYMENT_CONFIRMED_URL"
    );

    this.consumer = Consumer.create({
      queueUrl,
      sqs: new SQSClient({
        region: process.env.AWS_REGION || "us-east-1",
        ...(process.env.AWS_ENDPOINT && { endpoint: process.env.AWS_ENDPOINT }),
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
        },
      }),
      handleMessage: async (message) => {
        try {
          this.logger.debug(`Mensagem SQS capturada: ${message.MessageId}`);

          const body = JSON.parse(message.Body!);
          const payload = (
            body.Message ? JSON.parse(body.Message) : body
          ) as PaymentConfirmedMessage;

          if (!payload.sessionId) {
            this.logger.error("Evento ignorado: sessionId ausente no payload.");
            return;
          }

          this.logger.log(
            `Processando pagamento. SessionID: ${payload.sessionId}`
          );

          const cart = await this.cartGateway.getCartBySessionId(
            payload.sessionId
          );

          if (!cart) {
            this.logger.warn(
              `Carrinho vazio ou não encontrado session ${payload.sessionId}`
            );
            return;
          }

          const productionItems = cart.items.map((item) => ({
            sku: item.sku,
            quantity: item.quantity,
          }));

          const result = await this.receiveApprovedOrderUseCase.execute(
            payload.sessionId,
            productionItems
          );

          if (result.isFailure) {
            this.logger.error(
              `Falha no domínio ao criar pedido: ${result.getValue()}`
            );
            return;
          }

          this.logger.log(
            `SUCESSO! Pedido criado na cozinha. Session: ${payload.sessionId}`
          );
        } catch (error) {
          this.logger.error(
            "Erro fatal no processamento da mensagem SQS:",
            error
          );
          throw error;
        }
      },
    });

    this.consumer.on("error", (err) => {
      this.logger.error(`Erro no Consumer SQS: ${err.message}`);
    });

    this.consumer.on("processing_error", (err) => {
      this.logger.error(`Erro de processamento: ${err.message}`);
    });

    this.consumer.start();
  }

  onModuleDestroy() {
    if (this.consumer) this.consumer.stop();
  }
}
