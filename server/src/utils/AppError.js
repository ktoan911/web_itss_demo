export class AppError extends Error {
  constructor(message, statusCode = 500, code, fields) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;
  }
}
