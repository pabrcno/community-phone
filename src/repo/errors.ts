import { AppError } from "../core/index.ts";

export class DatabaseError extends AppError {
  public readonly query?: string;

  constructor(message: string, query?: string) {
    super(
      `${message}${query ? ` | Query: ${query}` : ""}`,
      500,
      "DatabaseError"
    );
    this.query = query;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NotFoundError");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "ConflictError");
  }
}
