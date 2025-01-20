import type { ICallsRepository, TCall } from "../domain/index.ts";
import { DatabaseError, NotFoundError } from "./errors.ts";
import { env } from "../injector.ts";
import pkg from "pg";

export class PostgresCallsRepository implements ICallsRepository {
  private pool: pkg.Pool;
  constructor(pool: pkg.Pool) {
    this.pool = pool;
    this.pool.query(
      `CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        call_id VARCHAR(255) NOT NULL UNIQUE,
        "from" VARCHAR(255) NOT NULL,
        "to" VARCHAR(255) NOT NULL,
        started TIMESTAMP NOT NULL,
        ended TIMESTAMP,
        duration INT
      )`
    );
  }

  async saveStart(call: Omit<TCall, "id" | "ended">): Promise<TCall> {
    const query = `
      INSERT INTO calls (call_id, "from", "to", started, duration)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (call_id)
      DO UPDATE SET
        "from" = EXCLUDED."from",
        "to" = EXCLUDED."to",
        started = EXCLUDED.started,
        duration = EXCLUDED.duration
      RETURNING *;
    `;

    try {
      const values = [
        call.callId,
        call.from,
        call.to,
        call.started,
        call.duration,
      ];
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      throw new DatabaseError(`Error saving start: ${err.message}`, query);
    }
  }

  async saveEnd(
    callId: string,
    ended: string,
    duration: number
  ): Promise<TCall> {
    const query = `
      UPDATE calls
      SET ended = $2, duration = $3
      WHERE call_id = $1
      RETURNING *;
    `;

    try {
      const values = [callId, ended, duration];
      const result = await this.pool.query(query, values);
      if (result.rows.length === 0) {
        throw new NotFoundError(`Call with call_id ${callId} not found`);
      }
      return result.rows[0];
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw err;
      }
      throw new DatabaseError(`Error saving end: ${err.message}`, query);
    }
  }

  async findById(id: string): Promise<TCall | null> {
    const query = `SELECT * FROM calls WHERE id = $1;`;
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] ?? null;
    } catch (err) {
      throw new DatabaseError(`Error finding by ID: ${err.message}`, query);
    }
  }

  async findByCallId(callId: string): Promise<TCall | null> {
    const query = `SELECT * FROM calls WHERE call_id = $1;`;
    try {
      const result = await this.pool.query(query, [callId]);
      return result.rows[0] ?? null;
    } catch (err) {
      throw new DatabaseError(`Error finding by callId: ${err.message}`, query);
    }
  }

  async findStaleCalls(olderThan: Date): Promise<TCall[]> {
    const query = `
      SELECT * FROM calls
      WHERE ended IS NULL AND started < $1;
    `;
    try {
      const result = await this.pool.query(query, [olderThan.toISOString()]);
      return result.rows;
    } catch (err) {
      throw new DatabaseError(
        `Error finding stale calls: ${err.message}`,
        query
      );
    }
  }

  async findUnfinishedCalls(lastTwoHours: Date): Promise<TCall[]> {
    const query = `
      SELECT * FROM calls
      WHERE ended IS NULL AND started >= $1;
    `;
    try {
      const result = await this.pool.query(query, [lastTwoHours.toISOString()]);
      return result.rows;
    } catch (err) {
      throw new DatabaseError(
        `Error finding unfinished calls: ${err.message}`,
        query
      );
    }
  }
}
