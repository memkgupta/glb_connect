import { APIError } from "./APIError";

export class ConflictError extends APIError {
    constructor(message: string = 'Conflict') {
      super(message, 409);
    }
  }