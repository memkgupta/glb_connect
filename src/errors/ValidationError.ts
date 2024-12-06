import { APIError } from './APIError';

export class ValidationError extends APIError {
  constructor(message: string = 'Validation Error') {
    super(message, 422);
  }
}