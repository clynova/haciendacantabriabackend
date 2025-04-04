export class AppError extends Error {
    status;
    isOperational;

    constructor(message, statusCode) {
        super(message);

        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}