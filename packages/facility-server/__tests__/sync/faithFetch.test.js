import { summariseFaithError } from '../../app/sync/faithFetch';

// verbatim from faith 0.2.3, refusing a connection on a realistic sync pull url
const REFUSED = {
  code: 'Network',
  message:
    'Network: reqwest::Error { kind: Request, url: "http://127.0.0.1:1/api/sync/' +
    '8f14e45f-ceea-467a-9d3f-b1e5d4a5f2c1/pull?fromSessionIndex=0&limit=1000", source: ' +
    'hyper_util::client::legacy::Error(Connect, ConnectError("tcp connect error", 127.0.0.1:1, ' +
    'Os { code: 61, kind: ConnectionRefused, message: "Connection refused" })) } -> ' +
    'hyper_util::client::legacy::Error(Connect, ConnectError("tcp connect error", 127.0.0.1:1, ' +
    'Os { code: 61, kind: ConnectionRefused, message: "Connection refused" })) -> ' +
    'ConnectError("tcp connect error", 127.0.0.1:1, Os { code: 61, kind: ConnectionRefused, ' +
    'message: "Connection refused" }) -> ' +
    'Os { code: 61, kind: ConnectionRefused, message: "Connection refused" }',
};

describe('summariseFaithError', () => {
  it('keeps the diagnosis rather than the url the chain leads with', () => {
    expect(summariseFaithError(REFUSED)).toBe(
      'Network: Os { code: 61, kind: ConnectionRefused, message: "Connection refused" }',
    );
  });

  it('caps a long innermost segment', () => {
    const summary = summariseFaithError({
      code: 'Network',
      message: `Network: outer -> ${'NoRecordsFound('.repeat(30)}`,
    });
    expect(summary).toHaveLength(201);
    expect(summary.endsWith('…')).toBe(true);
  });

  it('leaves a single-segment message alone', () => {
    expect(summariseFaithError({ code: 'Aborted', message: 'Aborted: the request was aborted' })).toBe(
      'Aborted: the request was aborted',
    );
  });
});
