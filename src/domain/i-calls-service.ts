import type { TCallEvent } from "./t-call-event.ts";
import { TCall } from "./t-call.ts";

export interface ICallsService {
  /**
   * Processes a new call event.
   *
   * Use Case:
   * - Handles incoming events related to calls, including:
   *   1. **Call Started**:
   *      - Creates a new record in the system for a call, using the `call_id` and `started` timestamp.
   *   2. **Call Ended**:
   *      - Updates an existing call record to include the `ended` timestamp.
   *      - Calculates call duration if applicable.
   *
   * Behavior:
   * - Validates the `TCallEvent` payload to ensure the presence of required fields.
   * - Creates or updates the corresponding call record in the system.
   * - Delegates data persistence to the `CallRepository`.
   *
   * - PROPOSAL:
   *   - Interaction with Cron Logic:
   *   - For calls that are not explicitly marked as ended via an `ended` event,
   *     a separate cron job ensures they are auto-closed after 1 hour.
   *
   * @param event The call event payload, containing `call_id`, `from`, `to`,
   *   and either `started` or `ended` timestamps.
   */
  handleEvent(event: TCallEvent): Promise<TCall | null>;

  /**
   * Provides the total number of calls that were not marked as ended within the last two hours.
   *
   * Use Case:
   * - This is used by monitoring systems to identify calls that may not have received
   *   an `ended` event from the external provider.
   *
   * Behavior:
   * - Queries the `CallRepository` for calls that:
   *   1. Have a `started` timestamp within the last two hours.
   *   2. Do not have an `ended` timestamp.
   *
   * Response:
   * - Returns the total count of such calls as a number.
   *
   * Cron Logic Interaction:
   * - Calls that are auto-closed after one hour are excluded from this count.
   * - The `/metrics` endpoint provides this count for real-time monitoring.
   *
   * @returns The number of calls without an `ended` timestamp in the last two hours.
   */
  getStaleCallsCount(): Promise<number>;
}
