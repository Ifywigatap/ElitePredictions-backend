import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Express middleware to validate request bodies using Zod schemas.
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // .parse() validates the data, coerces types if configured, 
      // and strips out any fields not explicitly defined in the schema.
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errorMessages });
      }
      logger.error('Unexpected error during validation:', error);
      next(error);
    }
  };
};