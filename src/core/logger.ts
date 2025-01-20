class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  logInfo(message: string): void {
    this.writeLog("INFO", message);
  }

  logError(error: Error | string): void {
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack}`
        : error;
    this.writeLog("ERROR", message);
  }

  logWarning(message: string): void {
    this.writeLog("WARNING", message);
  }

  private writeLog(level: string, message: string): void {
    const timestamp = this.getTimestamp();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
  }
}

export const logger = new Logger();
