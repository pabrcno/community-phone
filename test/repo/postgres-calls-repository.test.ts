import { describe, it, expect, beforeEach, afterEach } from "vitest";
import pkg from "pg";
import { PostgresCallsRepository } from "../../src/repo/postgres-calls-repository.ts";
import { DatabaseError, NotFoundError } from "../../src/repo/errors.ts";

describe("PostgresCallRepository", () => {
  let pool: pkg.Pool;
  let repository: PostgresCallsRepository;

  beforeEach(async () => {
    pool = new pkg.Pool({
      host: "localhost",
      port: 5432,
      database: "postgres",
      user: "postgres",
      password: "password",
    });
    repository = new PostgresCallsRepository(pool);
  });

  afterEach(async () => {
    await pool.query("DELETE FROM calls");
    await pool.end();
  });

  describe("saveStart", () => {
    it("should save a new call start", async () => {
      const call = {
        callId: "123",
        from: "555-0123",
        to: "555-4567",
        started: new Date().toISOString(),
      };

      const result = await repository.saveStart(call);

      expect(result).toMatchObject({
        call_id: call.callId,
        from: call.from,
        to: call.to,
        started: expect.any(Date),
        ended: null,
        duration: null,
      });
    });

    it("should throw DatabaseError on invalid data", async () => {
      const invalidCall = {
        callId: null,
        from: "555-0123",
        to: "555-4567",
        started: new Date().toISOString(),
      };

      await expect(repository.saveStart(invalidCall as any)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe("saveEnd", () => {
    it("should save call end time", async () => {
      const call = {
        callId: "123",
        from: "555-0123",
        to: "555-4567",
        started: new Date().toISOString(),
      };
      await repository.saveStart(call);

      const ended = new Date().toISOString();
      const duration = new Date().getTime() - new Date(call.started).getTime();
      const result = await repository.saveEnd(call.callId, ended, duration);

      expect(result).toMatchObject({
        call_id: call.callId,
        ended: expect.any(Date),
        duration: duration,
      });
    });

    it("should throw NotFoundError for non-existent call", async () => {
      const ended = new Date().toISOString();
      await expect(repository.saveEnd("nonexistent", ended, 0)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("findById", () => {
    it("should find call by id", async () => {
      const call = {
        callId: "123",
        from: "555-0123",
        to: "555-4567",
        started: new Date().toISOString(),
      };
      const saved = await repository.saveStart(call);

      const result = await repository.findById(saved.id.toString());

      expect(result).toMatchObject({
        id: saved.id,
        call_id: call.callId,
        duration: null,
      });
    });

    it("should return null for non-existent id", async () => {
      const result = await repository.findById("999");
      expect(result).toBeNull();
    });
  });

  describe("findByCallId", () => {
    it("should find call by callId", async () => {
      const call = {
        callId: "123",
        from: "555-0123",
        to: "555-4567",
        started: new Date().toISOString(),
      };
      await repository.saveStart(call);

      const result = await repository.findByCallId(call.callId);

      expect(result).toMatchObject({
        call_id: call.callId,
        from: call.from,
        to: call.to,
        duration: null,
      });
    });

    it("should return null for non-existent callId", async () => {
      const result = await repository.findByCallId("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("findStaleCalls", () => {
    it("should find stale calls", async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 3);

      const call = {
        callId: "123",
        from: "555-0123",
        to: "555-4567",
        started: oldDate.toISOString(),
      };
      await repository.saveStart(call);

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 1);

      const results = await repository.findStaleCalls(cutoffDate);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        call_id: call.callId,
        ended: null,
        duration: null,
      });
    });
  });

  describe("findUnfinishedCalls", () => {
    it("should find unfinished calls from last 2 hours", async () => {
      const call = {
        callId: "123",
        from: "555-0123",
        to: "555-4567",
        started: new Date().toISOString(),
      };
      await repository.saveStart(call);

      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const results = await repository.findUnfinishedCalls(twoHoursAgo);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        call_id: call.callId,
        ended: null,
        duration: null,
      });
    });
  });
});
