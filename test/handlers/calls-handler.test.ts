import { describe, it, expect, vi, beforeEach } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import { CallsHandler } from "../../src/handlers/calls-handler";
import { ICallsService } from "../../src/domain";
import { AppError, InternalServerError } from "../../src/core";

describe("CallsHandler", () => {
  let handler: CallsHandler;
  let mockService: ICallsService;
  let mockRequest: IncomingMessage;
  let mockResponse: ServerResponse;

  beforeEach(() => {
    mockService = {
      handleEvent: vi.fn().mockImplementation(() => Promise.resolve()),
      getUnfinishedCallsCount: vi
        .fn()
        .mockImplementation(() => Promise.resolve(0)),
    };

    handler = new CallsHandler(mockService);

    mockRequest = {
      on: vi.fn(),
    } as unknown as IncomingMessage;

    mockResponse = {
      writeHead: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse;
  });

  describe("handleEvent", () => {
    it("should handle valid call event successfully", async () => {
      const validEvent = {
        call_id: "123",
        started: new Date().toISOString(),
        from: "123",
        to: "456",
      };

      mockRequest.on = vi.fn((event, callback) => {
        if (event === "data") {
          callback(JSON.stringify(validEvent));
          return mockRequest;
        }
        if (event === "end") {
          callback();
          return mockRequest;
        }
        return mockRequest;
      });

      await handler.handleEvent(mockRequest, mockResponse);

      expect(mockService.handleEvent).toHaveBeenCalledWith(validEvent);
      expect(mockResponse.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "application/json",
      });
      expect(mockResponse.end).toHaveBeenCalledWith(
        JSON.stringify({ status: "ok" })
      );
    });

    it("should handle AppError from service", async () => {
      mockRequest.on = vi.fn((event, callback) => {
        if (event === "data") {
          callback(JSON.stringify({}));
          return mockRequest;
        }
        if (event === "end") {
          callback();
          return mockRequest;
        }
        return mockRequest;
      });
      const error = new AppError("Test error", 400, "Test error");
      mockService.handleEvent = vi.fn().mockRejectedValue(error);

      await handler.handleEvent(mockRequest, mockResponse);

      expect(mockResponse.writeHead).toHaveBeenCalledWith(400, {
        "Content-Type": "application/json",
      });
      expect(mockResponse.end).toHaveBeenCalledWith(
        JSON.stringify({ error: "Test error" })
      );
    });

    it("should handle unexpected errors", async () => {
      mockRequest.on = vi.fn((event, callback) => {
        if (event === "data") {
          callback(JSON.stringify({}));
          return mockRequest;
        }
        if (event === "end") {
          callback();
          return mockRequest;
        }
        return mockRequest;
      });
      mockService.handleEvent = vi
        .fn()
        .mockRejectedValue(new Error("Unexpected error"));

      await handler.handleEvent(mockRequest, mockResponse);

      expect(mockResponse.writeHead).toHaveBeenCalledWith(500, {
        "Content-Type": "application/json",
      });
      expect(mockResponse.end).toHaveBeenCalledWith(
        JSON.stringify({ error: new InternalServerError().message })
      );
    });
  });

  describe("handleMetrics", () => {
    it("should return metrics successfully", async () => {
      const unfinishedCalls = 5;
      mockService.getUnfinishedCallsCount = vi
        .fn()
        .mockResolvedValue(unfinishedCalls);

      await handler.handleMetrics(mockRequest, mockResponse);

      expect(mockResponse.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "application/json",
      });
      expect(mockResponse.end).toHaveBeenCalledWith(
        JSON.stringify({ latestUnfinishedCalls: unfinishedCalls })
      );
    });

    it("should handle errors when getting metrics", async () => {
      mockService.getUnfinishedCallsCount = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await handler.handleMetrics(mockRequest, mockResponse);

      expect(mockResponse.writeHead).toHaveBeenCalledWith(500, {
        "Content-Type": "application/json",
      });
      expect(mockResponse.end).toHaveBeenCalledWith(
        JSON.stringify({ error: "Failed to retrieve metrics" })
      );
    });
  });
});
