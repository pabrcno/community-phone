import type { TCall } from "./t-call.ts";

export interface ICallsRepository {
  /**
   * Saves a new call record when a call starts.
   * @param call The call data to save (without the `ended` field).
   * @returns The saved call with its internal `id`.
   */
  saveStart(
    call: Omit<TCall, "id" | "ended" | "createdAt" | "updatedAt">
  ): Promise<TCall>;

  /**
   * Updates an existing call record to mark the call as ended.
   * @param callId The external `call_id` of the call.
   * @param ended The timestamp for when the call ended.
   * @returns The updated call record.
   */
  saveEnd(callId: string, ended: string, duration: number): Promise<TCall>;

  /**
   * Finds a call by its internal `id`.
   * @param id The internal `id` of the call.
   * @returns The matching call, or `null` if not found.
   */
  findById(id: string): Promise<TCall | null>;

  /**
   * Finds a call by its external `call_id`.
   * @param callId The external `call_id` of the call.
   * @returns The matching call, or `null` if not found.
   */
  findByCallId(callId: string): Promise<TCall | null>;

  /**
   * Finds calls that are older than the specified time and do not have an `ended` timestamp.
   * It should return all calls that were started more than 1 hour ago and before the cutoff timestamp.
   * @param cutoff The cutoff timestamp for finding stale calls.
   * @returns A list of stale calls.
   */
  findStaleCalls(cutoff: Date, start?: Date): Promise<TCall[]>;
}
