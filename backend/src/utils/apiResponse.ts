import { Response } from 'express';

export class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}

export const successResponse = (data: unknown) => ({
  status: 'success',
  data
});

export const errorResponse = (message: string) => ({
  status: 'error',
  message
});

export const sendSuccess = (res: Response, data: any, message: string = 'Success', statusCode: number = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

export const sendError = (res: Response, error: any, statusCode: number = 400) => {
  return res.status(statusCode).json({
    status: 'error',
    message: error.message || 'An error occurred',
    errors: error.errors
  });
};
