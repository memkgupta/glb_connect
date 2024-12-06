import { APIError } from './APIError';

export class InternalServerError extends APIError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500);
  }
}