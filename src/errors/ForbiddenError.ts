import { APIError } from './APIError';

export class ForbiddenError extends APIError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}