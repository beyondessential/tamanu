import { Result } from '../protocols/result';

export const resultSucess = (data: any): Result<any> => {
  return {
    data,
    error: null,
  };
};

export const resultWithError = (error: Error): Result<any> => {
  return {
    data: null,
    error,
  };
};
