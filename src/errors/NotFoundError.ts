import { APIError } from "./APIError";

export class NotFoundError extends APIError {
    constructor(message: string = 'Not Found') {
      super(message, 404);
    }
  }