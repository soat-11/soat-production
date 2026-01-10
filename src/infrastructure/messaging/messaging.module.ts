import { Module, Global, Logger } from "@nestjs/common";
import { SQSClient } from "@aws-sdk/client-sqs";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SqsEventPublisher } from "./producers/sqs-event-publisher";
import { HttpModule } from "@nestjs/axios";
import { CartGateway } from "@infra/gayteways/cart.gateway";

@Global()
@Module({
  imports: [ConfigModule, HttpModule],
  providers: [
    {
      provide: "SQS_CLIENT",
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const region = configService.get<string>("AWS_REGION") || "us-east-1";
        const endpoint = configService.get<string>("AWS_ENDPOINT");
        const accessKeyId = configService.get<string>("AWS_ACCESS_KEY_ID");
        const secretAccessKey = configService.get<string>(
          "AWS_SECRET_ACCESS_KEY"
        );

        return new SQSClient({
          region: region,
          ...(endpoint && {
            endpoint: endpoint,
          }),
          credentials: {
            accessKeyId: accessKeyId || "test",
            secretAccessKey: secretAccessKey || "test",
          },
        });
      },
    },
    {
      provide: "IEventPublisher",
      useClass: SqsEventPublisher,
    },
    SqsEventPublisher,
    CartGateway,
  ],
  exports: ["IEventPublisher", "SQS_CLIENT", CartGateway],
})
export class MessagingModule {}
