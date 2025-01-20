import { BadRequestError, NotFoundError } from "../core/index.ts";
import type {
  ICallsRepository,
  ICallsService,
  TCall,
  TCallEvent,
} from "../domain/index.ts";

export class CallsService implements ICallsService {
  private readonly repository: ICallsRepository;

  constructor(repository: ICallsRepository) {
    this.repository = repository;
  }

  async handleEvent(event: TCallEvent): Promise<TCall | null> {
    this.validateEventPayload(event);

    const existingCall = await this.repository.findByCallId(event.call_id);

    if (event.ended && existingCall && !existingCall.ended) {
      const duration =
        new Date(event.ended).getTime() -
        new Date(existingCall.started).getTime();

      if (duration < 0) {
        throw new BadRequestError(
          `Invalid event: End time cannot be before start time`
        );
      }

      const call = await this.repository.saveEnd(
        event.call_id,
        event.ended,
        duration
      );

      return call;
    }

    if (event.started && !existingCall) {
      return await this.repository.saveStart({
        callId: event.call_id,
        from: event.from,
        to: event.to,
        started: event.started,
      });
    }

    if (event.ended && !existingCall) {
      throw new NotFoundError(`Cannot end call ${event.call_id} - not found`);
    }
    if (event.ended && existingCall?.ended) {
      throw new BadRequestError(`Call ${event.call_id} was already ended`);
    }
    if (event.started && existingCall) {
      throw new BadRequestError(`Call ${event.call_id} was already started`);
    }

    return null;
  }

  async getStaleCallsCount(): Promise<number> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const unfinishedCalls = await this.repository.findStaleCalls(twoHoursAgo);

    return unfinishedCalls.length;
  }

  private validateEventPayload(event: TCallEvent): void {
    if (!event.call_id) {
      throw new BadRequestError("Invalid event: Missing call_id");
    }

    if (event.started && event.ended) {
      throw new BadRequestError(
        "Invalid event: Cannot have both started and ended timestamps"
      );
    }

    if (!event.started && !event.ended) {
      throw new BadRequestError(
        "Invalid event: Must have either started or ended timestamp"
      );
    }

    if (event.started && isNaN(Date.parse(event.started))) {
      throw new BadRequestError(
        "Invalid event: Invalid started timestamp format"
      );
    }

    if (event.ended && isNaN(Date.parse(event.ended))) {
      throw new BadRequestError(
        "Invalid event: Invalid ended timestamp format"
      );
    }

    if (!event.from) {
      throw new BadRequestError("Invalid event: Missing from number");
    }

    if (!event.to) {
      throw new BadRequestError("Invalid event: Missing to number");
    }
  }
}
