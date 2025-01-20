import { logger } from "./logger.ts";

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number, name: string) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;

    logger.logError(`${this.name} (${statusCode}): ${message}`);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NotFoundError");
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, 400, "BadRequestError");
    this.name = "BadRequestError";
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500, "InternalServerError");
    this.name = "InternalServerError";
  }
}
