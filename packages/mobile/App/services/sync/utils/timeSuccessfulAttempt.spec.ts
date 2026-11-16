import { timeSuccessfulAttempt } from './timeSuccessfulAttempt';

describe('timeSuccessfulAttempt', () => {
  it('returns the result with how long the request took', async () => {
    const { result, durationMs } = await timeSuccessfulAttempt(async onAttempt => {
      onAttempt();
      jest.advanceTimersByTime(200);
      return 'page';
    });

    expect(result).toBe('page');
    expect(durationMs).toBe(200);
  });

  it('leaves out the time spent on attempts that failed', async () => {
    const { durationMs } = await timeSuccessfulAttempt(async onAttempt => {
      onAttempt();
      jest.advanceTimersByTime(1_000); // the first attempt fails, and the retry waits
      onAttempt();
      jest.advanceTimersByTime(200);
      return 'page';
    });

    expect(durationMs).toBe(200);
  });
});
