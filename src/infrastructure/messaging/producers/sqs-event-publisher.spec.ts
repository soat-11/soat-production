import { Test, TestingModule } from "@nestjs/testing";
import { SqsEventPublisher } from "./sqs-event-publisher";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

jest.mock("@aws-sdk/client-sqs", () => {
  return {
    SQSClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn(),
      };
    }),
    SendMessageCommand: jest.fn().mockImplementation((input) => {
      return { input };
    }),
  };
});

describe("SqsEventPublisher", () => {
  let publisher: SqsEventPublisher;
  let sqsClientMock: any;
  let configService: ConfigService;

  beforeEach(async () => {
    sqsClientMock = {
      send: jest.fn(),
    };

    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "debug").mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SqsEventPublisher,
        {
          provide: "SQS_CLIENT",
          useValue: sqsClientMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const urls = {
                SQS_PRODUCTION_STARTED_URL: "http://queue/started",
                SQS_PRODUCTION_READY_URL: "http://queue/ready",
                SQS_PRODUCTION_WITHDRAWN_URL: "http://queue/withdrawn",
              };
              return urls[key];
            }),
          },
        },
      ],
    }).compile();

    publisher = module.get<SqsEventPublisher>(SqsEventPublisher);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve publicar evento production.started corretamente", async () => {
    const payload = { sessionId: "123" };
    await publisher.publish("production.started", payload);

    expect(sqsClientMock.send).toHaveBeenCalledTimes(1);

    const command = sqsClientMock.send.mock.calls[0][0];
    expect(command.input.QueueUrl).toBe("http://queue/started");
    expect(command.input.MessageBody).toBe(JSON.stringify(payload));
  });

  it("deve publicar evento production.ready corretamente", async () => {
    const payload = { sessionId: "123" };
    await publisher.publish("production.ready", payload);

    const command = sqsClientMock.send.mock.calls[0][0];
    expect(command.input.QueueUrl).toBe("http://queue/ready");
  });

  it("deve publicar evento production.withdrawn corretamente", async () => {
    const payload = { sessionId: "123" };
    await publisher.publish("production.withdrawn", payload);

    const command = sqsClientMock.send.mock.calls[0][0];
    expect(command.input.QueueUrl).toBe("http://queue/withdrawn");
  });

  it("não deve publicar se o tópico for desconhecido", async () => {
    await publisher.publish("topico.invalido", {});

    expect(sqsClientMock.send).not.toHaveBeenCalled();
  });

  it("deve lançar erro se o envio falhar", async () => {
    sqsClientMock.send.mockRejectedValue(new Error("Erro AWS"));

    await expect(
      publisher.publish("production.started", { sessionId: "1" })
    ).rejects.toThrow("Erro AWS");
  });
});
