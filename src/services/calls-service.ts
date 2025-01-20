import { BadRequestError, NotFoundError } from "../core/index.ts";
import { logger } from "../core/logger.ts";
import type {
  ICallsRepository,
  ICallsService,
  TCallEvent,
} from "../domain/index.ts";

export class CallsService implements ICallsService {
  private readonly repository: ICallsRepository;

  constructor(repository: ICallsRepository) {
    this.repository = repository;
  }

  async handleEvent(event: TCallEvent): Promise<void> {
    if (!event.call_id || (!event.started && !event.ended)) {
      throw new BadRequestError("Invalid event: Missing required fields.");
    }

    const existingCall = await this.repository.findByCallId(event.call_id);

    if (event.ended) {
      if (existingCall?.ended) {
        throw new BadRequestError(`Call ${event.call_id} was already ended`);
      }

      const duration =
        new Date(event.ended).getTime() - new Date(event.started).getTime();
      await this.repository.saveEnd(event.call_id, event.ended, duration);
      logger.logInfo(`Call ${event.call_id} ended.`);
      return;
    }

    if (event.started) {
      if (existingCall)
        throw new BadRequestError(`Call ${event.call_id} was already started`);

      if (!event.from || !event.to)
        throw new BadRequestError(
          "Started event missing 'from' or 'to' fields"
        );

      await this.repository.saveStart({
        callId: event.call_id,
        from: event.from,
        to: event.to,
        started: event.started,
      });

      return;
    }
  }

  async getUnfinishedCallsCount(): Promise<number> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const unfinishedCalls = await this.repository.findUnfinishedCalls(
      twoHoursAgo
    );
    logger.logInfo(`Found ${unfinishedCalls.length} unfinished calls.`);
    return unfinishedCalls.length;
  }
}
