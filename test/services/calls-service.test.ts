import { describe, it, expect, vi, beforeEach } from "vitest";
import { CallsService } from "../../src/services/calls-service.ts";
import { ICallsRepository, TCallEvent } from "../../src/domain/index.ts";

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

      const expectedCall = {
        id: "1",
        callId: event.call_id,
        from: event.from,
        to: event.to,
        started: event.started,
        ended: null,
      };

      mockRepository.findByCallId = vi.fn().mockResolvedValue(null);
      mockRepository.saveStart = vi.fn().mockResolvedValue(expectedCall);

      const result = await service.handleEvent(event);

      expect(mockRepository.findByCallId).toHaveBeenCalledWith(event.call_id);
      expect(mockRepository.saveStart).toHaveBeenCalledWith({
        callId: event.call_id,
        from: event.from,
        to: event.to,
        started: event.started,
      });
      expect(result).toEqual(expectedCall);
    });

    it("should handle a valid 'ended' event successfully", async () => {
      const startTime = new Date("2024-01-01T10:00:00Z");
      const endTime = new Date("2024-01-01T11:00:00Z"); // 1 hour later

      const event: TCallEvent = {
        call_id: "123",
        started: startTime.toISOString(),
        ended: endTime.toISOString(),
        from: "123",
        to: "456",
      };

      const existingCall = {
        id: "1",
        callId: event.call_id,
        from: "123",
        to: "456",
        started: startTime.toISOString(),
        ended: null,
      };

      const expectedCall = {
        ...existingCall,
        ended: endTime.toISOString(),
        duration: 3600000,
      };

      mockRepository.findByCallId = vi.fn().mockResolvedValue(existingCall);
      mockRepository.saveEnd = vi.fn().mockResolvedValue(expectedCall);

      const result = await service.handleEvent(event);

      expect(mockRepository.findByCallId).toHaveBeenCalledWith(event.call_id);
      expect(mockRepository.saveEnd).toHaveBeenCalledWith(
        event.call_id,
        event.ended,
        3600000 // 1 hour in milliseconds
      );
      expect(result).toEqual(expectedCall);
    });

    describe("validation errors", () => {
      it("should throw BadRequestError if call_id is missing", async () => {
        const event: TCallEvent = {
          call_id: "",
          started: new Date().toISOString(),
          from: "123",
          to: "456",
        };

        await expect(service.handleEvent(event)).rejects.toThrow(
          "Invalid event: Missing call_id"
        );
      });

      it("should throw BadRequestError if neither started nor ended is provided", async () => {
        const event = {
          call_id: "123",
          from: "123",
          to: "456",
        } as TCallEvent;

        await expect(service.handleEvent(event)).rejects.toThrow(
          "Invalid event: Must have either started or ended timestamp"
        );
      });

      it("should throw BadRequestError if started timestamp is invalid", async () => {
        const event: TCallEvent = {
          call_id: "123",
          started: "invalid-date",
          from: "123",
          to: "456",
        };

        await expect(service.handleEvent(event)).rejects.toThrow(
          "Invalid event: Invalid started timestamp format"
        );
      });

      it("should throw BadRequestError if ended timestamp is invalid", async () => {
        const event: TCallEvent = {
          call_id: "123",
          ended: "invalid-date",
          from: "123",
          to: "456",
        };

        await expect(service.handleEvent(event)).rejects.toThrow(
          "Invalid event: Invalid ended timestamp format"
        );
      });

      it("should throw BadRequestError if from number is missing", async () => {
        const event: TCallEvent = {
          call_id: "123",
          started: new Date().toISOString(),
          from: "",
          to: "456",
        };

        await expect(service.handleEvent(event)).rejects.toThrow(
          "Invalid event: Missing from number"
        );
      });

      it("should throw BadRequestError if to number is missing", async () => {
        const event: TCallEvent = {
          call_id: "123",
          started: new Date().toISOString(),
          from: "123",
          to: "",
        };

        await expect(service.handleEvent(event)).rejects.toThrow(
          "Invalid event: Missing to number"
        );
      });
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

      await expect(service.handleEvent(event)).rejects.toThrow(
        "Call 123 was already started"
      );
    });

    it("should throw NotFoundError when ending a non-existent call", async () => {
      const event: TCallEvent = {
        call_id: "123",
        ended: new Date().toISOString(),
        from: "123",
        to: "456",
      };

      mockRepository.findByCallId = vi.fn().mockResolvedValue(null);

      await expect(service.handleEvent(event)).rejects.toThrow(
        "Cannot end call 123 - not found"
      );
    });

    it("should throw BadRequestError when ending an already ended call", async () => {
      const event: TCallEvent = {
        call_id: "123",
        ended: new Date().toISOString(),
        from: "123",
        to: "456",
      };

      const existingCall = {
        id: "1",
        callId: event.call_id,
        from: "123",
        to: "456",
        started: new Date().toISOString(),
        ended: new Date().toISOString(),
      };

      mockRepository.findByCallId = vi.fn().mockResolvedValue(existingCall);

      await expect(service.handleEvent(event)).rejects.toThrow(
        "Call 123 was already ended"
      );
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
