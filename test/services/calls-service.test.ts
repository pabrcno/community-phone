import { describe, it, expect, vi, beforeEach } from "vitest";
import { CallsService } from "../../src/services/calls-service.ts";
import { ICallsRepository, TCallEvent } from "../../src/domain/index.ts";
import { BadRequestError } from "../../src/core/index.ts";

describe("CallsService", () => {
  let service: CallsService;
  let mockRepository: ICallsRepository;

  beforeEach(() => {
    mockRepository = {
      findByCallId: vi.fn(),
      saveStart: vi.fn(),
      saveEnd: vi.fn(),
      findById: vi.fn(),
      findStaleCalls: vi.fn(),
    };

    service = new CallsService(mockRepository);
  });

  describe("handleEvent", () => {
    it("should handle a valid 'started' event successfully", async () => {
      const event: TCallEvent = {
        call_id: "123",
        started: new Date().toISOString(),
        from: "123",
        to: "456",
      };

      mockRepository.findByCallId = vi.fn().mockResolvedValue(null);

      await service.handleEvent(event);

      expect(mockRepository.findByCallId).toHaveBeenCalledWith(event.call_id);
      expect(mockRepository.saveStart).toHaveBeenCalledWith({
        callId: event.call_id,
        from: event.from,
        to: event.to,
        started: event.started,
      });
    });

    it("should handle a valid 'ended' event successfully", async () => {
      const event: TCallEvent = {
        call_id: "123",
        started: new Date().toISOString(),
        ended: new Date().toISOString(),
        from: "123",
        to: "456",
      };

      const duration =
        new Date(event.ended!).getTime() - new Date(event.started).getTime();

      const existingCall = {
        id: "1",
        callId: event.call_id,
        from: "123",
        to: "456",
        started: new Date().toISOString(),
        ended: null,
      };

      mockRepository.findByCallId = vi.fn().mockResolvedValue(existingCall);

      await service.handleEvent(event);

      expect(mockRepository.findByCallId).toHaveBeenCalledWith(event.call_id);
      expect(mockRepository.saveEnd).toHaveBeenCalledWith(
        event.call_id,
        event.ended,
        duration
      );
    });

    it("should throw BadRequestError if event is invalid", async () => {
      const event: TCallEvent = {
        call_id: "",
        started: null as any,
        ended: new Date().toISOString(),
        from: "123",
        to: "456",
      };

      await expect(service.handleEvent(event)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError if starting an already started call", async () => {
      const event: TCallEvent = {
        call_id: "123",
        started: new Date().toISOString(),
        from: "123",
        to: "456",
      };

      const existingCall = {
        id: "1",
        callId: event.call_id,
        from: "123",
        to: "456",
        started: event.started,
        ended: null,
      };

      mockRepository.findByCallId = vi.fn().mockResolvedValue(existingCall);

      await expect(service.handleEvent(event)).rejects.toThrow(BadRequestError);
    });
  });

  describe("getStaleCallsCount", () => {
    it("should return the count of stale calls", async () => {
      const staleCalls = [
        {
          id: "1",
          callId: "123",
          started: new Date().toISOString(),
          ended: null,
        },
      ];

      mockRepository.findStaleCalls = vi.fn().mockResolvedValue(staleCalls);

      const result = await service.getStaleCallsCount();

      expect(mockRepository.findStaleCalls).toHaveBeenCalled();
      expect(result).toBe(staleCalls.length);
    });

    it("should handle errors gracefully", async () => {
      mockRepository.findStaleCalls = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));

      await expect(service.getStaleCallsCount()).rejects.toThrow(Error);
    });
  });
});
