import { callWithBackoff } from './callWithBackoff';

jest.useRealTimers();

describe('callWithBackoff', () => {
  jest.setTimeout(5000); // 5 seconds should be well and truly enough

  it('retries attempts up to a maximum number', async () => {
    // arrange
    const fn = jest
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('0')))
      .mockImplementationOnce(() => Promise.reject(new Error('1')))
      .mockImplementationOnce(() => Promise.resolve(2));

    // act
    const result = await callWithBackoff(fn, { maxAttempts: 3 });

    // assert
    expect(fn.mock.calls).toHaveLength(3);
    expect(result).toEqual(2);
  });

  it('fails after the maximum number of retries', async () => {
    // arrange
    const errs = ['0', '1', '2'].map(msg => new Error(msg));
    const fn = jest
      .fn()
      .mockImplementationOnce(() => Promise.reject(errs[0]))
      .mockImplementationOnce(() => Promise.reject(errs[1]))
      .mockImplementationOnce(() => Promise.reject(errs[2]));

    // act
    const result = callWithBackoff(fn, { maxAttempts: 3 });

    // assert
    await expect(result).rejects.toEqual(errs[2]);
    expect(fn.mock.calls).toHaveLength(3);
  });

  it('waits an increasing amount of time', async () => {
    // arrange
    const config = { maxAttempts: 5, maxWaitMs: 10000, multiplierMs: 50 };
    let n = 0;
    const fn = jest.fn(() => Promise.reject(new Error(`${n++}`)));
    const startMs = Date.now();

    // act
    const promise = callWithBackoff(fn, config);

    // assert
    await expect(promise).rejects.toHaveProperty('message', (config.maxAttempts - 1).toString());
    const elapsedMs = Date.now() - startMs;
    expect(elapsedMs).toBeGreaterThanOrEqual((1 + 1 + 2 + 3) * config.multiplierMs);
    expect(elapsedMs).toBeLessThan((1 + 1 + 2 + 3 + 5) * config.multiplierMs);
  });

  it('obeys the upper bound on wait time', async () => {
    // arrange
    const config = { maxAttempts: 5, maxWaitMs: 100, multiplierMs: 100 };
    let n = 0;
    const fn = jest.fn(() => Promise.reject(new Error(`${n++}`)));
    const startMs = Date.now();

    // act
    const promise = callWithBackoff(fn, config);

    // assert
    await expect(promise).rejects.toHaveProperty('message', (config.maxAttempts - 1).toString());
    const elapsedMs = Date.now() - startMs;
    expect(elapsedMs).toBeGreaterThanOrEqual((config.maxAttempts - 1) * config.maxWaitMs);
    expect(elapsedMs).toBeLessThan(config.maxAttempts * config.maxWaitMs);
  });
});
