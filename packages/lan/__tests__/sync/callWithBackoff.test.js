import { callWithBackoff } from '~/sync/callWithBackoff';

describe('callWithBackoff', () => {
  it('retries attempts up to a maximum number', async () => {
    const fn = jest
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('1')))
      .mockImplementationOnce(() => Promise.reject(new Error('2')))
      .mockImplementationOnce(() => Promise.resolve(3));

    const result = await callWithBackoff(fn, { maxRetries: 3, maxWaitMs: 0 });
    expect(fn.mock.calls).toHaveLength(3);
    expect(result).toEqual(3);
  });

  it.todo('fails after the maximum number of retries');
  it.todo('waits an increasing amount of time');
  it.todo('obeys the upper bound on wait time');
});
