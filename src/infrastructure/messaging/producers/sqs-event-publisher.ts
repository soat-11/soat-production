import { Inject, Injectable, Logger } from "@nestjs/common";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { ConfigService } from "@nestjs/config";
import { IEventPublisher } from "@domain/events/i-event-publisher";

@Injectable()
export class SqsEventPublisher implements IEventPublisher {
  private readonly logger = new Logger(SqsEventPublisher.name);

  constructor(
    @Inject("SQS_CLIENT") private readonly sqsClient: SQSClient,
    private readonly configService: ConfigService
  ) {}

  async publish(topic: string, payload: any): Promise<void> {
    const queueUrl = this.getQueueUrl(topic);

    if (!queueUrl) {
      this.logger.warn(
        `Tópico '${topic}' não tem fila configurada. Evento ignorado.`
      );
      return;
    }

    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
      });

      await this.sqsClient.send(command);
      this.logger.log(
        `Evento '${topic}' publicado com sucesso para pedido ${payload.sessionId}`
      );
    } catch (error) {
      this.logger.error(`Erro ao publicar evento '${topic}':`, error);
      throw error;
    }
  }

  private getQueueUrl(topic: string): string | undefined {
    switch (topic) {
      case "production.started":
        return this.configService.get<string>("SQS_PRODUCTION_STARTED_URL");
      case "production.ready":
        return this.configService.get<string>("SQS_PRODUCTION_READY_URL");
      case "production.withdrawn":
        return this.configService.get<string>("SQS_PRODUCTION_WITHDRAWN_URL");
      default:
        return undefined;
    }
  }
}
