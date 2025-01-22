import type { IncomingMessage, ServerResponse } from "http";

export interface ICallsHandler {
  /**
   * Handles the call event (POST /events).
   *
   * Use Case:
   * - This method processes incoming webhook events from an external service.
   * - It handles two types of events:
   *   1. **Call Started**:
   *      - Includes information about the `call_id`, `from`, `to`, and `started` timestamp.
   *      - Stores this information in the system if the call is new.
   *   2. **Call Ended**:
   *      - Includes the `call_id`, `from`, `to`, and `ended` timestamp.
   *      - Updates an existing call record to include the `ended` timestamp and calculate the call duration.
   *
   * Behavior:
   * - Parses and validates the incoming JSON payload.
   * - Delegates processing logic to the `CallService` to handle persistence and business rules.
   * - Responds with:
   *   - **200 OK**: If the event is successfully processed.
   *   - call: {
   *         id: number;
   *        callId: string;
   *         from: string;
   *         to: string;
   *         started: string;
   *         ended?: string;
   *         duration?: number;
   *         createdAt: string;
   *         updatedAt: string;
   *       }  
   *   - **400 Bad Request**: If the JSON payload is invalid or required fields are missing.
   *
   * @param req The incoming HTTP request containing the event payload.
   * @param res The outgoing HTTP response indicating the processing result.
   */
  handleEvent(req: IncomingMessage, res: ServerResponse): Promise<void>;

  /**
   * Handles the metrics request (GET /metrics).
   *
   * Use Case:
   * - This method serves as a monitoring endpoint to provide real-time insights
   *   into the number of calls that have not been marked as ended within the
   *   last two hours.
   *
   * Behavior:
   * - Queries the `CallService` for the count of calls that:
   *   1. Have a `started` timestamp.
   *   2. Do not have an `ended` timestamp.
   *   3. Were started within the last two hours.
   * - Formats the result into a JSON response.
   *
   * Response:
   * - **200 OK**: Includes the count of unfinished calls in the following structure:
   *   ```json
   *   {
   *     "latestStaleCalls": 5
   *   }
   *   ```
   * - **500 Internal Server Error**: If an unexpected issue occurs during processing.
   *
   *
   * @param req The incoming HTTP request (empty for this endpoint).
   * @param res The outgoing HTTP response containing the metrics in JSON format.
   */
  handleMetrics(req: IncomingMessage, res: ServerResponse): Promise<void>;
}
