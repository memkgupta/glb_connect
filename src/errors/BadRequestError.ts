import { APIError } from "./APIError";

export class BadRequestError extends APIError {
    constructor(message: string = 'Bad Request') {
      super(message, 400);
    }
  }