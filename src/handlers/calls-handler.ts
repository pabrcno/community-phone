import type { IncomingMessage, ServerResponse } from "http";
import type {
  ICallsService,
  ICallsHandler,
  TCallEvent,
  TMetricsResponse,
} from "../domain/index.ts";
import { InternalServerError } from "../core/index.ts";
import { AppError } from "../core/app-error.ts";
import { DatabaseError } from "../repo/errors.ts";

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
        const call = await this.service.handleEvent(event);

        res.writeHead(200, { "Content-Type": "application/json" });

        res.end(JSON.stringify({ status: "ok", call }));
      } catch (err) {
        const errorResponse = {
          error:
            err instanceof DatabaseError
              ? err.name
              : err instanceof AppError
              ? err.message
              : new InternalServerError().message,
        };

        const statusCode = err instanceof AppError ? err.statusCode : 500;

        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(errorResponse));
      }
    });
  }

  async handleMetrics(_: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const latestStaleCalls = await this.service.getStaleCallsCount();
      const response: TMetricsResponse = { latestStaleCalls };

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
