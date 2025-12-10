import { describe, expect, it, vi } from 'vitest';
import { runFunctionInBatches } from '../src/runFunctionInBatches';
import { sleepAsync } from '../src/sleepAsync';

describe('runFunctionInBatches', () => {
  // Mock function with delay to test async behavior
  const asyncFunction = async (batch: number[]): Promise<number[]> => {
    await sleepAsync(10);
    return batch.map(n => n * 2);
  };

  describe('basic functionality', () => {
    it('should process a small array that fits in one batch', async () => {
      const input = [1, 2, 3, 4, 5];
      const result = await runFunctionInBatches(input, asyncFunction, 10);
      expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    it('should process an array that requires multiple batches', async () => {
      const input = Array.from({ length: 25 }, (_, i) => i + 1); // [1, 2, ..., 25]
      const result = await runFunctionInBatches(input, asyncFunction, 10);
      const expected = input.map(n => n * 2);
      expect(result).toEqual(expected);
    });

    it('should handle empty array', async () => {
      const input: number[] = [];
      const result = await runFunctionInBatches(input, asyncFunction);
      expect(result).toEqual([]);
    });

    it('should handle single element array', async () => {
      const input = [42];
      const result = await runFunctionInBatches(input, asyncFunction);
      expect(result).toEqual([84]);
    });
  });

  describe('batch size handling', () => {
    it('should respect custom batch size', async () => {
      const input = Array.from({ length: 7 }, (_, i) => i); // [0, 1, 2, 3, 4, 5, 6]
      const mockFn = vi.fn().mockImplementation(asyncFunction);

      const result = await runFunctionInBatches(input, mockFn, 3);

      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockFn).toHaveBeenNthCalledWith(1, [0, 1, 2]);
      expect(mockFn).toHaveBeenNthCalledWith(2, [3, 4, 5]);
      expect(mockFn).toHaveBeenNthCalledWith(3, [6]);
      expect(result).toEqual([0, 2, 4, 6, 8, 10, 12]);
    });

    it('should handle batch size larger than array length', async () => {
      const input = [1, 2, 3];
      const mockFn = vi.fn().mockImplementation(asyncFunction);

      const result = await runFunctionInBatches(input, mockFn, 100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(input);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should handle batch size of 1', async () => {
      const input = [1, 2, 3];
      const mockFn = vi.fn().mockImplementation(asyncFunction);

      const result = await runFunctionInBatches(input, mockFn, 1);

      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(mockFn).toHaveBeenNthCalledWith(1, [1]);
      expect(mockFn).toHaveBeenNthCalledWith(2, [2]);
      expect(mockFn).toHaveBeenNthCalledWith(3, [3]);
      expect(result).toEqual([2, 4, 6]);
    });
  });
});
