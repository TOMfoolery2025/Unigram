export {
  ErrorCategory,
  BaseAppError,
  DatabaseError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  handleError,
  sanitizeError,
  isRetryableError,
  type AppError,
} from './handler';
