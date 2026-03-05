export class AppError extends Error {
  constructor(
    message,
    { code = "APP_ERROR", httpStatus = 500, exitCode = 2, details = undefined } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.exitCode = exitCode;
    this.details = details;
  }
}

export function toAppError(error, fallbackMessage, fallback = {}) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(fallbackMessage || error?.message || "Unexpected error", fallback);
}
