import { faithFetch } from '../../app/sync/faithFetch';

const faithError = (code, name) => {
  const error = new Error('Network: reqwest::Error { kind: Request, url: "…" } -> long rust chain');
  error.code = code;
  error.name = name;
  return error;
};

const fetch = jest.fn();

jest.mock('@passcod/faith', () => ({
  fetch: (...args) => fetch(...args),
  ERROR_CODES: { Network: 'Network', Timeout: 'Timeout', Aborted: 'Aborted' },
}));

describe('faithFetch', () => {
  afterEach(() => fetch.mockReset());

  it('replaces the rust error chain with the error code', async () => {
    fetch.mockRejectedValue(faithError('Network', 'NetworkError'));
    await expect(faithFetch('https://central.example.org/api/whoami')).rejects.toThrow(
      'faith: Network',
    );
  });

  it('keeps the original error as the cause', async () => {
    const original = faithError('Timeout', 'AbortError');
    fetch.mockRejectedValue(original);
    await expect(faithFetch('https://central.example.org/api/whoami')).rejects.toMatchObject({
      cause: original,
    });
  });

  it('passes through an error with no code, as body stream reads throw', async () => {
    const streamFailure = new Error('stream closed');
    fetch.mockRejectedValue(streamFailure);
    await expect(faithFetch('https://central.example.org/api/whoami')).rejects.toBe(streamFailure);
  });

  it('returns the response untouched', async () => {
    const response = { ok: true, status: 200 };
    fetch.mockResolvedValue(response);
    await expect(faithFetch('https://central.example.org/api/whoami', { method: 'GET' })).resolves.toBe(
      response,
    );
    expect(fetch).toHaveBeenCalledWith('https://central.example.org/api/whoami', { method: 'GET' });
  });
});
