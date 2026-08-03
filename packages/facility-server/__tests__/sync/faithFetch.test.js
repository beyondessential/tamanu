import { summariseFaithError } from '../../app/sync/faithFetch';

// verbatim from faith 0.2.3, resolving a host that does not exist
const DNS_FAILURE =
  'Network: reqwest::Error { kind: Request, url: "https://central.example.com/api/sync", ' +
  'source: hyper_util::client::legacy::Error(Connect, ConnectError("dns error", ' +
  'Dns(NoRecordsFound(NoRecords { query: Query { name: Name("central.example.com."), ' +
  'query_type: A, query_class: IN } })))) } -> hyper_util::client::legacy::Error(Connect, ' +
  'ConnectError("dns error", Dns(NoRecordsFound(NoRecords { query: Query { name: ' +
  'Name("central.example.com."), query_type: A } })))) -> ConnectError("dns error")';

describe('summariseFaithError', () => {
  it('keeps the diagnosis and drops the repeated error chain', () => {
    const summary = summariseFaithError(DNS_FAILURE);
    expect(summary.length).toBeLessThanOrEqual(201);
    expect(summary).toContain('dns error');
    expect(summary).not.toContain(' -> ');
  });

  it('leaves a short message alone', () => {
    expect(summariseFaithError('Aborted: the request was aborted')).toBe(
      'Aborted: the request was aborted',
    );
  });
});
