import type { IncomingMessage, ServerResponse } from "http";
import type {
  ICallsService,
  ICallsHandler,
  TCallEvent,
  TMetricsResponse,
} from "../domain/index.ts";
import { InternalServerError } from "../core/index.ts";
import { AppError } from "../core/app-error.ts";

export class CallsHandler implements ICallsHandler {
  private readonly service: ICallsService;

  constructor(service: ICallsService) {
    this.service = service;
  }

  async handleEvent(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const event: TCallEvent = JSON.parse(body);
        await this.service.handleEvent(event);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
      } catch (err) {
        if (err instanceof AppError) {
          res.writeHead(err.statusCode, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        } else {
          const internalError = new InternalServerError();
          res.writeHead(internalError.statusCode, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify({ error: internalError.message }));
        }
      }
    });
  }

  async handleMetrics(_: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const latestUnfinishedCalls =
        await this.service.getUnfinishedCallsCount();
      const response: TMetricsResponse = { latestUnfinishedCalls };

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response));
    } catch (err) {
      const internalError = new InternalServerError(
        "Failed to retrieve metrics"
      );
      res.writeHead(internalError.statusCode, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ error: internalError.message }));
    }
  }
}
