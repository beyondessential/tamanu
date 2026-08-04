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
  Agent: class Agent {
    constructor(options) {
      this.options = options;
    }
  },
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
    expect(fetch).toHaveBeenCalledWith(
      'https://central.example.org/api/whoami',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('makes every request on one agent with the HTTP/3 upgrade disabled', async () => {
    fetch.mockResolvedValue({ ok: true, status: 200 });
    await faithFetch('https://central.example.org/api/whoami');
    await faithFetch('https://central.example.org/api/whoami');
    const agents = fetch.mock.calls.map(([, { agent }]) => agent);
    expect(agents[0].options).toEqual({ http3: { upgradeEnabled: false } });
    expect(agents[1]).toBe(agents[0]);
  });
});
